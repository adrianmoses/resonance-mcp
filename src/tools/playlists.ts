import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyClient } from "../spotify/client.js";
import type Database from "better-sqlite3";
import { getCachedPlaylists, cachePlaylists } from "../cache/queries.js";
import { formatToolError } from "../utils/errors.js";

export function registerPlaylistTools(
  server: McpServer,
  spotify: SpotifyClient,
  db: Database.Database,
): void {
  server.tool(
    "spotify_get_playlists",
    "Get the current user's playlists",
    {
      limit: z.number().min(1).max(50).default(20).describe("Number of playlists"),
      offset: z.number().min(0).default(0).describe("Offset for pagination"),
    },
    async ({ limit, offset }) => {
      try {
        if (offset === 0) {
          const cached = getCachedPlaylists(db);
          if (cached) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ playlists: cached.slice(0, limit), total: cached.length }, null, 2),
                },
              ],
            };
          }
        }

        const results = await spotify.getPlaylists(limit, offset);
        cachePlaylists(db, results.playlists);

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

  server.tool(
    "spotify_create_playlist",
    "Create a new Spotify playlist",
    {
      name: z.string().describe("Playlist name"),
      description: z.string().default("").describe("Playlist description"),
      public: z.boolean().default(false).describe("Whether the playlist is public"),
    },
    async (args) => {
      try {
        const playlist = await spotify.createPlaylist(
          args.name,
          args.description,
          args.public,
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(playlist, null, 2) }],
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
