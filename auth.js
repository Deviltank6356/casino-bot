const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const config = require("./config.json");

const app = express();

// =============================
// SPOTIFY CLIENT
// =============================
const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri
});

// =============================
// LOGIN ROUTE (FIXED SCOPES + FORCE CONSENT)
// =============================
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-read-playback-state"
  ];

  const url = spotify.createAuthorizeURL(
    scopes,
    "state",
    true // 🔥 forces re-consent so new scopes apply
  );

  res.redirect(url);
});

// =============================
// CALLBACK ROUTE
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

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    console.log("✅ ACCESS TOKEN:");
    console.log(accessToken);

    console.log("🔁 REFRESH TOKEN:");
    console.log(refreshToken);

    // save refresh token
    config.spotify.refreshToken = refreshToken;

    fs.writeFileSync(
      "./config.json",
      JSON.stringify(config, null, 2)
    );

    res.send("Spotify connected successfully ✔ You can close this tab.");

  } catch (err) {
    console.error("Spotify auth error:", err?.body || err.message || err);
    res.status(500).send("Auth failed");
  }
});

// =============================
// START SERVER
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running");
  console.log(`Login: https://solving-final-fort-crystal.trycloudflare.com/login`);
});