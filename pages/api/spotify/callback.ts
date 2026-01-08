// Spotify OAuth - Step 2: Handle callback and get refresh token
// This endpoint receives the auth code and exchanges it for tokens

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `Spotify auth error: ${error}` });
  }

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "No authorization code received" });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Spotify credentials not configured" });
  }

  // Build callback URL (must match what was sent to Spotify)
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/spotify/callback`;

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return res.status(400).json({ error: `Token exchange failed: ${errorText}` });
    }

    const tokens = await tokenRes.json();

    // Display the refresh token for the user to save
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #1a1a1a;
              color: #fff;
            }
            h1 { color: #1DB954; }
            .token-box {
              background: #333;
              padding: 15px;
              border-radius: 8px;
              word-break: break-all;
              margin: 20px 0;
              font-family: monospace;
              font-size: 12px;
            }
            .instructions {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            code {
              background: #444;
              padding: 2px 6px;
              border-radius: 4px;
            }
            a { color: #1DB954; }
          </style>
        </head>
        <body>
          <h1>✅ Spotify Connected!</h1>
          <p>Add this refresh token to your <code>.env.local</code> file:</p>

          <div class="token-box">
            SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}
          </div>

          <div class="instructions">
            <strong>Your .env.local should have:</strong>
            <pre>
SPOTIFY_CLIENT_ID=${clientId}
SPOTIFY_CLIENT_SECRET=your_secret_here
SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}
            </pre>
          </div>

          <p>After adding the token, restart your dev server and Lucifer will be able to control Spotify!</p>
          <p><a href="/">← Back to Chat</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: `Failed to exchange token: ${error}` });
  }
}
