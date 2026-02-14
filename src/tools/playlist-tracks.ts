import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpotifyClient } from "../spotify/client.js";
import { formatToolError } from "../utils/errors.js";

export function registerPlaylistTrackTools(
  server: McpServer,
  spotify: SpotifyClient,
): void {
  server.tool(
    "spotify_add_to_playlist",
    "Add tracks to a Spotify playlist",
    {
      playlistId: z.string().describe("Spotify playlist ID"),
      trackUris: z
        .array(z.string())
        .describe('Track URIs to add (e.g. ["spotify:track:xxx"])'),
    },
    async ({ playlistId, trackUris }) => {
      try {
        await spotify.addTracksToPlaylist(playlistId, trackUris);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                added: trackUris.length,
                playlistId,
              }),
            },
          ],
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
    "spotify_remove_from_playlist",
    "Remove tracks from a Spotify playlist",
    {
      playlistId: z.string().describe("Spotify playlist ID"),
      trackUris: z
        .array(z.string())
        .describe('Track URIs to remove (e.g. ["spotify:track:xxx"])'),
    },
    async ({ playlistId, trackUris }) => {
      try {
        await spotify.removeTracksFromPlaylist(playlistId, trackUris);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                removed: trackUris.length,
                playlistId,
              }),
            },
          ],
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
