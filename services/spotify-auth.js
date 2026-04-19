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

  const url = spotify.createAuthorizeURL(scopes, "state123");
  res.redirect(url);
});

// =============================
// CALLBACK
// =============================
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.send("No code received");

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    console.log("ACCESS TOKEN:", accessToken);
    console.log("REFRESH TOKEN:", refreshToken);

    // SAVE PERMANENTLY
    config.spotify.refreshToken = refreshToken;

    fs.writeFileSync(
      path.join(__dirname, "../config.json"),
      JSON.stringify(config, null, 2)
    );

    res.send("✅ Spotify connected! You can close this tab.");

  } catch (err) {
    console.error(err);
    res.status(500).send("Auth failed");
  }
});

// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("Spotify Auth running on port 3000");
  console.log("Login URL: http://79.72.92.17:3000/login");
});