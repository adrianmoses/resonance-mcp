# resonance-mcp

Personal music intelligence MCP server powered by Spotify. Exposes your Spotify library, playlists, and search as tools that Claude can call via the Model Context Protocol.

## Setup

```bash
npm install
npm run build
```

### Environment Variables

Create a `.env` file or set these in your shell:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | — | Your Spotify app client ID |
| `SPOTIFY_REDIRECT_URI` | No | `http://localhost:8888/callback` | OAuth redirect URI |
| `DB_PATH` | No | `./data/resonance.sqlite` | SQLite database path |

### Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app
2. Set the redirect URI to `http://localhost:8888/callback`
3. Copy the Client ID into `SPOTIFY_CLIENT_ID`

On first run, the server will open your browser for Spotify authorization. Tokens are cached in `data/tokens.json`.

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "resonance": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/resonance-mcp",
      "env": {
        "SPOTIFY_CLIENT_ID": "your-client-id"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `spotify_search` | Search for tracks on Spotify |
| `spotify_get_saved_tracks` | Get your saved/liked tracks |
| `spotify_get_playlists` | Get your playlists |
| `spotify_create_playlist` | Create a new playlist |
| `spotify_add_to_playlist` | Add tracks to a playlist |
| `spotify_remove_from_playlist` | Remove tracks from a playlist |

## Development

```bash
npm run dev      # Run with tsx (auto-compiles)
npm run build    # Compile TypeScript
npm test         # Run tests
```
