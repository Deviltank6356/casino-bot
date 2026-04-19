const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");

const app = express();

const CONFIG_PATH = path.join(__dirname, "../config.json");

// =============================
// SPOTIFY INSTANCE (base only)
// =============================
const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri
});

// =============================
// HELPERS
// =============================
function saveRefreshToken(token) {
  const updated = {
    ...config,
    spotify: {
      ...config.spotify,
      refreshToken: token
    }
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
}

// =============================
// LOGIN
// =============================
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const state = Math.random().toString(36).slice(2);

  const url = spotify.createAuthorizeURL(scopes, state);
  res.redirect(url);
});

// =============================
// CALLBACK
// =============================
app.get("/callback", async (req, res) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.status(400).send("❌ OAuth denied");
    }

    if (!code) {
      return res.status(400).send("❌ No code received");
    }

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    console.log("✅ Spotify tokens received");

    // Set tokens for immediate use
    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    // Persist refresh token ONLY
    saveRefreshToken(refreshToken);

    res.send("✅ Spotify connected successfully. You can close this tab.");

  } catch (err) {
    console.error("Spotify auth failed:", err?.body || err.message || err);
    res.status(500).send("❌ Auth failed");
  }
});

// =============================
// REFRESH TOKEN HELPER (IMPORTANT FIX)
// =============================
async function refreshAccessToken() {
  try {
    spotify.setRefreshToken(config.spotify.refreshToken);

    const data = await spotify.refreshAccessToken();

    spotify.setAccessToken(data.body.access_token);

    console.log("🔄 Spotify access token refreshed");
    return data.body.access_token;

  } catch (err) {
    console.error("❌ Refresh failed:", err.message);
    return null;
  }
}

// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify Auth running on port 3000");
  console.log("➡ Login: http://localhost:3000/login");
});

module.exports = { spotify, refreshAccessToken };