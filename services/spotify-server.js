const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");

const app = express();

const CONFIG_PATH = path.join(__dirname, "../config.json");

// =============================
// SPOTIFY CLIENT
// =============================
const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri
});

// =============================
// LOGIN
// =============================
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const url = spotify.createAuthorizeURL(scopes);

  res.redirect(url);
});

// =============================
// CALLBACK
// =============================
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    // set immediately (important for testing)
    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    // persist ONLY refresh token (correct practice)
    const updatedConfig = {
      ...config,
      spotify: {
        ...config.spotify,
        refreshToken
      }
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));

    console.log("✅ Spotify connected successfully");

    res.send("Spotify connected. You can close this tab.");

  } catch (err) {
    console.error("Spotify auth failed:", err?.body || err.message || err);
    res.status(500).send("Auth failed");
  }
});

// =============================
// START SERVER
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify auth running on port 3000");
});