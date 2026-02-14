import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./utils/config.js";
import { authenticateSpotify } from "./spotify/auth.js";
import { SpotifyClient } from "./spotify/client.js";
import { getDb, closeDb } from "./cache/db.js";
import { registerAllTools } from "./tools/index.js";

async function main() {
  const config = loadConfig();

  console.error("resonance-mcp starting...");

  // Initialize SQLite
  const db = getDb(config.dbPath);
  console.error(`Database initialized at ${config.dbPath}`);

  // Authenticate with Spotify
  const spotifyApi = await authenticateSpotify(config);
  const spotify = new SpotifyClient(spotifyApi);
  console.error("Spotify client ready");

  // Create MCP server
  const server = new McpServer({
    name: "resonance-mcp",
    version: "0.1.0",
  });

  // Register tools
  registerAllTools(server, spotify, db);
  console.error("Tools registered");

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("resonance-mcp running on stdio");

  // Graceful shutdown
  process.on("SIGINT", () => {
    closeDb();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
