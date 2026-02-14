import type Database from "better-sqlite3";

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      artists TEXT NOT NULL,
      album TEXT NOT NULL,
      uri TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      popularity INTEGER NOT NULL,
      cached_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      track_count INTEGER NOT NULL,
      uri TEXT NOT NULL,
      owner TEXT NOT NULL,
      public INTEGER NOT NULL DEFAULT 0,
      cached_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      cached_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_cache (
      query TEXT PRIMARY KEY,
      results TEXT NOT NULL,
      cached_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
}
