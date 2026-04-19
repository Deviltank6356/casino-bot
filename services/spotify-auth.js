const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");

const app = express();

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

  const state = Math.random().toString(36).substring(2, 15);

  const url = spotify.createAuthorizeURL(scopes, state);
  res.redirect(url);
});

// =============================
// CALLBACK
// =============================
app.get("/callback", async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error("Spotify OAuth error:", error);
      return res.status(400).send("OAuth denied");
    }

    if (!code) {
      return res.status(400).send("No code received");
    }

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    console.log("✅ ACCESS TOKEN RECEIVED");
    console.log("🔁 REFRESH TOKEN RECEIVED");

    // IMPORTANT: set tokens immediately
    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    // update config safely
    const updatedConfig = {
      ...config,
      spotify: {
        ...config.spotify,
        refreshToken
      }
    };

    fs.writeFileSync(
      path.join(__dirname, "../config.json"),
      JSON.stringify(updatedConfig, null, 2)
    );

    res.send("✅ Spotify connected successfully. You can close this tab.");

  } catch (err) {
    console.error("Spotify auth failed:", err?.body || err.message || err);
    res.status(500).send("Auth failed");
  }
});

// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify Auth running on port 3000");
  console.log("Login URL: http://localhost:3000/login");
});