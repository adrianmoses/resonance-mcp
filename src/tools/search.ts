import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyClient } from "../spotify/client.js";
import type Database from "better-sqlite3";
import { getCachedSearch, setCachedSearch, cacheTracks } from "../cache/queries.js";
import { formatToolError } from "../utils/errors.js";

export function registerSearchTools(
  server: McpServer,
  spotify: SpotifyClient,
  db: Database.Database,
): void {
  server.tool(
    "spotify_search",
    "Search for tracks on Spotify",
    {
      query: z.string().describe("Search query (artist, track name, etc.)"),
      limit: z.number().min(1).max(50).default(20).describe("Number of results"),
      offset: z.number().min(0).default(0).describe("Offset for pagination"),
    },
    async ({ query, limit, offset }) => {
      try {
        const cacheKey = `${query}:${limit}:${offset}`;
        const cached = getCachedSearch(db, cacheKey);
        if (cached) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }],
          };
        }

        const results = await spotify.search(query, limit, offset);
        setCachedSearch(db, cacheKey, results);
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
