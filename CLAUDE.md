# CLAUDE.md

## Project Overview

**resonance-mcp** — A personal music intelligence MCP server that exposes Spotify operations as tools for Claude via the Model Context Protocol. TypeScript, Node.js, SQLite caching.

## Development Setup

```bash
npm install
npm run build
```

Requires Node.js 18+ and a Spotify Developer app (set `SPOTIFY_CLIENT_ID` env var).

## Commands

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run all tests
npm test
```

## Architecture

- **src/index.ts** — MCP server entry point: initializes DB, Spotify auth, registers tools, connects stdio transport
- **src/spotify/auth.ts** — Spotify OAuth2 Authorization Code + PKCE flow, token caching/refresh
- **src/spotify/client.ts** — `SpotifyClient`: typed wrapper around `@spotify/web-api-ts-sdk` (search, saved tracks, playlists)
- **src/spotify/types.ts** — Simplified type definitions (`SimplifiedTrack`, `SimplifiedPlaylist`, `SearchResults`)
- **src/tools/** — MCP tool registrations (one file per tool group), barrel export via `registerAllTools()`
- **src/cache/db.ts** — SQLite connection setup with `better-sqlite3`
- **src/cache/schema.ts** — Table definitions: `tracks`, `playlists`, `playlist_tracks`, `search_cache`
- **src/cache/queries.ts** — Typed read/write helpers with TTL-based cache invalidation
- **src/utils/config.ts** — Environment variable loading (`SPOTIFY_CLIENT_ID`, `SPOTIFY_REDIRECT_URI`, `DB_PATH`)
- **src/utils/errors.ts** — Custom error classes and formatting

## Key Dependencies

`@modelcontextprotocol/sdk`, `@spotify/web-api-ts-sdk`, `better-sqlite3`, `zod`, `open`

## Environment Variables

- `SPOTIFY_CLIENT_ID` (required) — Spotify app client ID
- `SPOTIFY_REDIRECT_URI` (default: `http://localhost:8888/callback`)
- `DB_PATH` (default: `./data/resonance.sqlite`)
