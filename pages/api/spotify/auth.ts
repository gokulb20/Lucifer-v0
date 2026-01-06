// Spotify OAuth - Step 1: Redirect to Spotify login
// Visit this endpoint once to start the authentication flow

import type { NextApiRequest, NextApiResponse } from "next";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: "SPOTIFY_CLIENT_ID not configured" });
  }

  // Build callback URL based on request
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/spotify/callback`;

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("show_dialog", "true");

  res.redirect(authUrl.toString());
}
