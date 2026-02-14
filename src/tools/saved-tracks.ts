import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyClient } from "../spotify/client.js";
import type Database from "better-sqlite3";
import { cacheTracks } from "../cache/queries.js";
import { formatToolError } from "../utils/errors.js";

export function registerSavedTrackTools(
  server: McpServer,
  spotify: SpotifyClient,
  db: Database.Database,
): void {
  server.tool(
    "spotify_get_saved_tracks",
    "Get the current user's saved/liked tracks",
    {
      limit: z.number().min(1).max(50).default(20).describe("Number of tracks"),
      offset: z.number().min(0).default(0).describe("Offset for pagination"),
    },
    async ({ limit, offset }) => {
      try {
        const results = await spotify.getSavedTracks(limit, offset);
        cacheTracks(db, results.tracks);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: formatToolError(err) }],
          isError: true,
        };
      }
    },
  );
}
