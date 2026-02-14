import { SpotifyApi, type MaxInt } from "@spotify/web-api-ts-sdk";
import type {
  SimplifiedTrack,
  SimplifiedPlaylist,
  SearchResults,
} from "./types.js";
import { SpotifyApiError } from "../utils/errors.js";

export class SpotifyClient {
  constructor(private api: SpotifyApi) {}

  async search(query: string, limit = 20, offset = 0): Promise<SearchResults> {
    try {
      const results = await this.api.search(query, ["track"], undefined, limit as MaxInt<50>, offset);
      const tracks = (results.tracks?.items ?? []).map(simplifyTrack);
      return { tracks, total: results.tracks?.total ?? 0 };
    } catch (err) {
      throw wrapError("Search failed", err);
    }
  }

  async getSavedTracks(
    limit = 20,
    offset = 0,
  ): Promise<{ tracks: SimplifiedTrack[]; total: number }> {
    try {
      const results = await this.api.currentUser.tracks.savedTracks(limit as MaxInt<50>, offset);
      const tracks = results.items.map((item) => simplifyTrack(item.track));
      return { tracks, total: results.total };
    } catch (err) {
      throw wrapError("Failed to get saved tracks", err);
    }
  }

  async getPlaylists(
    limit = 20,
    offset = 0,
  ): Promise<{ playlists: SimplifiedPlaylist[]; total: number }> {
    try {
      const results = await this.api.currentUser.playlists.playlists(limit as MaxInt<50>, offset);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const playlists = results.items.map((p: any) => simplifyPlaylist(p));
      return { playlists, total: results.total };
    } catch (err) {
      throw wrapError("Failed to get playlists", err);
    }
  }

  async createPlaylist(
    name: string,
    description = "",
    isPublic = false,
  ): Promise<SimplifiedPlaylist> {
    try {
      const user = await this.api.currentUser.profile();
      const playlist = await this.api.playlists.createPlaylist(user.id, {
        name,
        description,
        public: isPublic,
      });
      return simplifyPlaylist(playlist);
    } catch (err) {
      throw wrapError("Failed to create playlist", err);
    }
  }

  async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[],
  ): Promise<void> {
    try {
      await this.api.playlists.addItemsToPlaylist(playlistId, trackUris);
    } catch (err) {
      throw wrapError("Failed to add tracks to playlist", err);
    }
  }

  async removeTracksFromPlaylist(
    playlistId: string,
    trackUris: string[],
  ): Promise<void> {
    try {
      await this.api.playlists.removeItemsFromPlaylist(playlistId, {
        tracks: trackUris.map((uri) => ({ uri })),
      });
    } catch (err) {
      throw wrapError("Failed to remove tracks from playlist", err);
    }
  }
}

function simplifyTrack(track: {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  uri: string;
  duration_ms: number;
  popularity: number;
}): SimplifiedTrack {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name),
    album: track.album.name,
    uri: track.uri,
    durationMs: track.duration_ms,
    popularity: track.popularity,
  };
}

function simplifyPlaylist(playlist: {
  id: string;
  name: string;
  description: string | null;
  tracks: { total: number };
  uri: string;
  owner: { display_name?: string | null };
  public: boolean | null;
}): SimplifiedPlaylist {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description ?? "",
    trackCount: playlist.tracks.total,
    uri: playlist.uri,
    owner: playlist.owner.display_name ?? "Unknown",
    public: playlist.public ?? false,
  };
}

function wrapError(message: string, err: unknown): SpotifyApiError {
  const detail = err instanceof Error ? err.message : String(err);
  return new SpotifyApiError(`${message}: ${detail}`);
}
