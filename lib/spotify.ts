// Spotify Web API Integration (Single User - OAuth)

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";

// Check if Spotify is configured
export function isSpotifyConfigured(): boolean {
  return !!(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REFRESH_TOKEN
  );
}

// Get a fresh access token using the refresh token
async function getAccessToken(): Promise<string | null> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_REFRESH_TOKEN) {
    return null;
  }

  try {
    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
      }),
    });

    if (!res.ok) {
      console.error("Failed to refresh Spotify token:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error("Spotify token refresh error:", error);
    return null;
  }
}

// Make authenticated Spotify API request
async function spotifyFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "Spotify not authenticated" };
  }

  try {
    const res = await fetch(`${SPOTIFY_API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (res.status === 204) {
      return { success: true };
    }

    if (!res.ok) {
      const error = await res.text();
      return { error: `Spotify API error: ${error}` };
    }

    return res.json();
  } catch (error) {
    return { error: `Spotify request failed: ${error}` };
  }
}

// Get currently playing track
export async function getNowPlaying(): Promise<string> {
  const data = await spotifyFetch("/me/player/currently-playing");

  if (data.error) {
    return JSON.stringify(data);
  }

  if (!data || !data.item) {
    return JSON.stringify({ status: "Nothing is currently playing" });
  }

  return JSON.stringify({
    track: data.item.name,
    artist: data.item.artists?.map((a: any) => a.name).join(", "),
    album: data.item.album?.name,
    isPlaying: data.is_playing,
    progress: `${Math.floor((data.progress_ms || 0) / 1000)}s / ${Math.floor((data.item.duration_ms || 0) / 1000)}s`,
  });
}

// Play music (search and play)
export async function playMusic(query: string, type: string = "track"): Promise<string> {
  // First search for the item
  const searchData = await spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=${type}&limit=1`
  );

  if (searchData.error) {
    return JSON.stringify(searchData);
  }

  const resultKey = `${type}s`;
  const items = searchData[resultKey]?.items;

  if (!items || items.length === 0) {
    return JSON.stringify({ error: `No ${type} found for "${query}"` });
  }

  const item = items[0];
  const uri = item.uri;

  // Start playback
  const playData = await spotifyFetch("/me/player/play", {
    method: "PUT",
    body: JSON.stringify(
      type === "track" ? { uris: [uri] } : { context_uri: uri }
    ),
  });

  if (playData.error) {
    return JSON.stringify(playData);
  }

  return JSON.stringify({
    success: true,
    playing: item.name,
    artist: item.artists?.map((a: any) => a.name).join(", ") || item.owner?.display_name,
    type,
  });
}

// Pause playback
export async function pausePlayback(): Promise<string> {
  const data = await spotifyFetch("/me/player/pause", { method: "PUT" });

  if (data.error) {
    return JSON.stringify(data);
  }

  return JSON.stringify({ success: true, status: "Paused" });
}

// Resume playback
export async function resumePlayback(): Promise<string> {
  const data = await spotifyFetch("/me/player/play", { method: "PUT" });

  if (data.error) {
    return JSON.stringify(data);
  }

  return JSON.stringify({ success: true, status: "Playing" });
}

// Skip to next track
export async function skipTrack(): Promise<string> {
  const data = await spotifyFetch("/me/player/next", { method: "POST" });

  if (data.error) {
    return JSON.stringify(data);
  }

  return JSON.stringify({ success: true, status: "Skipped to next track" });
}

// Skip to previous track
export async function previousTrack(): Promise<string> {
  const data = await spotifyFetch("/me/player/previous", { method: "POST" });

  if (data.error) {
    return JSON.stringify(data);
  }

  return JSON.stringify({ success: true, status: "Went to previous track" });
}

// Search Spotify
export async function searchSpotify(query: string, type: string = "track", limit: number = 5): Promise<string> {
  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`
  );

  if (data.error) {
    return JSON.stringify(data);
  }

  const resultKey = `${type}s`;
  const items = data[resultKey]?.items || [];

  const results = items.map((item: any) => ({
    name: item.name,
    artist: item.artists?.map((a: any) => a.name).join(", ") || item.owner?.display_name,
    uri: item.uri,
  }));

  return JSON.stringify({ results });
}

// Set volume
export async function setVolume(percent: number): Promise<string> {
  const volume = Math.max(0, Math.min(100, percent));
  const data = await spotifyFetch(`/me/player/volume?volume_percent=${volume}`, { method: "PUT" });

  if (data.error) {
    return JSON.stringify(data);
  }

  return JSON.stringify({ success: true, volume: `${volume}%` });
}

// Tool definitions for Grok
export function getSpotifyTools() {
  return [
    {
      type: "function",
      function: {
        name: "spotify_now_playing",
        description: "Get the currently playing track on Spotify.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_play",
        description: "Play music on Spotify. Search and play a track, album, artist, or playlist.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "What to play - song name, artist, album, or playlist",
            },
            type: {
              type: "string",
              enum: ["track", "album", "artist", "playlist"],
              description: "Type of content to play (default: track)",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_pause",
        description: "Pause Spotify playback.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_resume",
        description: "Resume Spotify playback.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_skip",
        description: "Skip to the next track on Spotify.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_previous",
        description: "Go to the previous track on Spotify.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_search",
        description: "Search Spotify for tracks, artists, albums, or playlists.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            type: {
              type: "string",
              enum: ["track", "album", "artist", "playlist"],
              description: "Type of content to search for (default: track)",
            },
            limit: {
              type: "number",
              description: "Number of results (default: 5)",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "spotify_volume",
        description: "Set Spotify playback volume (0-100).",
        parameters: {
          type: "object",
          properties: {
            percent: {
              type: "number",
              description: "Volume level from 0 to 100",
            },
          },
          required: ["percent"],
        },
      },
    },
  ];
}

// Execute Spotify tool
export async function executeSpotifyTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "spotify_now_playing":
      return getNowPlaying();
    case "spotify_play":
      return playMusic(args.query as string, (args.type as string) || "track");
    case "spotify_pause":
      return pausePlayback();
    case "spotify_resume":
      return resumePlayback();
    case "spotify_skip":
      return skipTrack();
    case "spotify_previous":
      return previousTrack();
    case "spotify_search":
      return searchSpotify(
        args.query as string,
        (args.type as string) || "track",
        (args.limit as number) || 5
      );
    case "spotify_volume":
      return setVolume(args.percent as number);
    default:
      return JSON.stringify({ error: `Unknown Spotify tool: ${toolName}` });
  }
}
