export class SpotifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

export function formatToolError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Error: ${String(error)}`;
}
