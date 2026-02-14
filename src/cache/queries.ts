import type Database from "better-sqlite3";
import type { SimplifiedTrack, SimplifiedPlaylist } from "../spotify/types.js";

// TTL values in seconds
const SEARCH_TTL = 5 * 60; // 5 minutes
const TRACK_TTL = 24 * 60 * 60; // 24 hours
const PLAYLIST_TTL = 10 * 60; // 10 minutes

function isStale(cachedAt: number, ttlSeconds: number): boolean {
  return Date.now() / 1000 - cachedAt > ttlSeconds;
}

export function getCachedSearch(
  db: Database.Database,
  query: string,
): { tracks: SimplifiedTrack[]; total: number } | null {
  const row = db
    .prepare("SELECT results, cached_at FROM search_cache WHERE query = ?")
    .get(query) as { results: string; cached_at: number } | undefined;

  if (!row || isStale(row.cached_at, SEARCH_TTL)) return null;
  return JSON.parse(row.results);
}

export function setCachedSearch(
  db: Database.Database,
  query: string,
  results: { tracks: SimplifiedTrack[]; total: number },
): void {
  db.prepare(
    `INSERT OR REPLACE INTO search_cache (query, results, cached_at)
     VALUES (?, ?, unixepoch())`,
  ).run(query, JSON.stringify(results));
}

export function getCachedTrack(
  db: Database.Database,
  id: string,
): SimplifiedTrack | null {
  const row = db
    .prepare("SELECT * FROM tracks WHERE id = ?")
    .get(id) as
    | { id: string; name: string; artists: string; album: string; uri: string; duration_ms: number; popularity: number; cached_at: number }
    | undefined;

  if (!row || isStale(row.cached_at, TRACK_TTL)) return null;
  return {
    id: row.id,
    name: row.name,
    artists: JSON.parse(row.artists),
    album: row.album,
    uri: row.uri,
    durationMs: row.duration_ms,
    popularity: row.popularity,
  };
}

export function cacheTrack(
  db: Database.Database,
  track: SimplifiedTrack,
): void {
  db.prepare(
    `INSERT OR REPLACE INTO tracks (id, name, artists, album, uri, duration_ms, popularity, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
  ).run(
    track.id,
    track.name,
    JSON.stringify(track.artists),
    track.album,
    track.uri,
    track.durationMs,
    track.popularity,
  );
}

export function cacheTracks(
  db: Database.Database,
  tracks: SimplifiedTrack[],
): void {
  const insert = db.prepare(
    `INSERT OR REPLACE INTO tracks (id, name, artists, album, uri, duration_ms, popularity, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
  );

  const tx = db.transaction((items: SimplifiedTrack[]) => {
    for (const t of items) {
      insert.run(
        t.id,
        t.name,
        JSON.stringify(t.artists),
        t.album,
        t.uri,
        t.durationMs,
        t.popularity,
      );
    }
  });

  tx(tracks);
}

export function getCachedPlaylists(
  db: Database.Database,
): SimplifiedPlaylist[] | null {
  const rows = db
    .prepare("SELECT * FROM playlists ORDER BY name")
    .all() as Array<{
    id: string;
    name: string;
    description: string;
    track_count: number;
    uri: string;
    owner: string;
    public: number;
    cached_at: number;
  }>;

  if (rows.length === 0) return null;
  if (isStale(rows[0].cached_at, PLAYLIST_TTL)) return null;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    trackCount: row.track_count,
    uri: row.uri,
    owner: row.owner,
    public: row.public === 1,
  }));
}

export function cachePlaylists(
  db: Database.Database,
  playlists: SimplifiedPlaylist[],
): void {
  const insert = db.prepare(
    `INSERT OR REPLACE INTO playlists (id, name, description, track_count, uri, owner, public, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
  );

  const tx = db.transaction((items: SimplifiedPlaylist[]) => {
    for (const p of items) {
      insert.run(
        p.id,
        p.name,
        p.description,
        p.trackCount,
        p.uri,
        p.owner,
        p.public ? 1 : 0,
      );
    }
  });

  tx(playlists);
}
