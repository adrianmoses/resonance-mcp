import { SpotifyApi, AccessToken } from "@spotify/web-api-ts-sdk";
import http from "node:http";
import { URL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import open from "open";
import { Config } from "../utils/config.js";
import { SpotifyAuthError } from "../utils/errors.js";

const SCOPES = [
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
];

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

function getTokenPath(config: Config): string {
  return path.join(config.dataDir, "tokens.json");
}

function loadCachedTokens(config: Config): AccessToken | null {
  const tokenPath = getTokenPath(config);
  try {
    if (fs.existsSync(tokenPath)) {
      const data = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
      return data as AccessToken;
    }
  } catch {
    // Invalid token file, will re-auth
  }
  return null;
}

function saveTokens(config: Config, tokens: AccessToken): void {
  const tokenPath = getTokenPath(config);
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
}

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}

async function getAuthCodeFromBrowser(
  config: Config,
  codeChallenge: string,
): Promise<string> {
  const redirectUrl = new URL(config.spotifyRedirectUri);
  const port = parseInt(redirectUrl.port) || 8888;

  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL(SPOTIFY_AUTH_URL);
  authUrl.searchParams.set("client_id", config.spotifyClientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", config.spotifyRedirectUri);
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;

      const url = new URL(req.url, `http://localhost:${port}`);
      if (url.pathname !== "/callback") return;

      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Authorization failed</h1><p>You can close this tab.</p>");
        server.close();
        reject(new SpotifyAuthError(`Authorization denied: ${error}`));
        return;
      }

      if (returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>State mismatch</h1>");
        server.close();
        reject(new SpotifyAuthError("State mismatch in OAuth callback"));
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>No code received</h1>");
        server.close();
        reject(new SpotifyAuthError("No authorization code received"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<h1>Authorized!</h1><p>You can close this tab and return to Claude.</p>",
      );
      server.close();
      resolve(code);
    });

    server.listen(port, () => {
      console.error(`Waiting for Spotify authorization on port ${port}...`);
      open(authUrl.toString()).catch(() => {
        console.error(`Open this URL in your browser:\n${authUrl.toString()}`);
      });
    });

    server.on("error", (err) => {
      reject(
        new SpotifyAuthError(`Failed to start callback server: ${err.message}`),
      );
    });
  });
}

async function exchangeCodeForTokens(
  config: Config,
  code: string,
  codeVerifier: string,
): Promise<AccessToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.spotifyRedirectUri,
    client_id: config.spotifyClientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new SpotifyAuthError(`Token exchange failed: ${text}`);
  }

  const tokens = (await response.json()) as AccessToken;
  tokens.expires = Date.now() + tokens.expires_in * 1000;
  return tokens;
}

async function refreshAccessToken(
  config: Config,
  refreshToken: string,
): Promise<AccessToken> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.spotifyClientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new SpotifyAuthError(`Token refresh failed: ${text}`);
  }

  const tokens = (await response.json()) as AccessToken;
  tokens.expires = Date.now() + tokens.expires_in * 1000;
  if (!tokens.refresh_token) {
    tokens.refresh_token = refreshToken;
  }
  return tokens;
}

export async function authenticateSpotify(config: Config): Promise<SpotifyApi> {
  let tokens = loadCachedTokens(config);

  if (tokens) {
    // Check if token needs refresh
    const expiresAt = tokens.expires ?? 0;
    if (Date.now() > expiresAt - 60_000 && tokens.refresh_token) {
      console.error("Refreshing Spotify access token...");
      try {
        tokens = await refreshAccessToken(config, tokens.refresh_token);
        saveTokens(config, tokens);
      } catch {
        console.error("Token refresh failed, re-authenticating...");
        tokens = null;
      }
    }
  }

  if (!tokens) {
    console.error("Starting Spotify authorization flow...");
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const code = await getAuthCodeFromBrowser(config, codeChallenge);
    tokens = await exchangeCodeForTokens(config, code, codeVerifier);
    saveTokens(config, tokens);
    console.error("Spotify authorization complete!");
  }

  const finalTokens = tokens;
  return SpotifyApi.withAccessToken(config.spotifyClientId, finalTokens);
}
