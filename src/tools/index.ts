import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyClient } from "../spotify/client.js";
import type Database from "better-sqlite3";
import { registerSearchTools } from "./search.js";
import { registerSavedTrackTools } from "./saved-tracks.js";
import { registerPlaylistTools } from "./playlists.js";
import { registerPlaylistTrackTools } from "./playlist-tracks.js";

export function registerAllTools(
  server: McpServer,
  spotify: SpotifyClient,
  db: Database.Database,
): void {
  registerSearchTools(server, spotify, db);
  registerSavedTrackTools(server, spotify, db);
  registerPlaylistTools(server, spotify, db);
  registerPlaylistTrackTools(server, spotify);
}
