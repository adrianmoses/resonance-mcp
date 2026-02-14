export interface Config {
  spotifyClientId: string;
  spotifyRedirectUri: string;
  dbPath: string;
  dataDir: string;
}

export function loadConfig(): Config {
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  if (!spotifyClientId) {
    throw new Error("SPOTIFY_CLIENT_ID environment variable is required");
  }

  const spotifyRedirectUri =
    process.env.SPOTIFY_REDIRECT_URI ?? "http://localhost:8888/callback";
  const dbPath = process.env.DB_PATH ?? "./data/resonance.sqlite";
  const dataDir = process.env.DATA_DIR ?? "./data";

  return { spotifyClientId, spotifyRedirectUri, dbPath, dataDir };
}
