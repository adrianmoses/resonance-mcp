export interface SimplifiedTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  uri: string;
  durationMs: number;
  popularity: number;
}

export interface SimplifiedPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  uri: string;
  owner: string;
  public: boolean;
}

export interface SearchResults {
  tracks: SimplifiedTrack[];
  total: number;
}
