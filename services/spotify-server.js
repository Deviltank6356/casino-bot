const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const config = require("../config.json");

const app = express();

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri
});

// LOGIN
app.get("/login", (req, res) => {
  const url = spotify.createAuthorizeURL([
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ]);

  res.redirect(url);
});

// CALLBACK
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const data = await spotify.authorizationCodeGrant(code);

    config.spotify.refreshToken = data.body.refresh_token;

    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));

    res.send("Spotify connected. You can close this tab.");
  } catch (e) {
    console.error(e);
    res.status(500).send("Auth failed");
  }
});

// IMPORTANT: bind to VM network
app.listen(3000, "0.0.0.0", () => {
  console.log("Spotify auth running on port 3000");
});