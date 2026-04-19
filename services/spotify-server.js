const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");

const app = express();

const CONFIG_PATH = path.join(__dirname, "../config.json");

// =============================
// CONFIG LOADER
// =============================
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    console.error("Config error:", err.message);
    return { spotify: {} };
  }
}

// =============================
// SPOTIFY CLIENT FACTORY
// =============================
function createSpotify() {
  const config = loadConfig();

  return new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    redirectUri: config.spotify.redirectUri
  });
}

// =============================
// ONLY SAVE REFRESH TOKEN
// =============================
function saveRefreshToken(refreshToken) {
  const cfg = loadConfig();

  cfg.spotify = {
    ...cfg.spotify,
    refreshToken
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// =============================
// LOGIN
// =============================
app.get("/login", (req, res) => {
  const spotify = createSpotify();

  const userId = req.query.user;
  if (!userId) return res.status(400).send("Missing user ID");

  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const url = spotify.createAuthorizeURL(scopes, userId, true);

  res.redirect(url);
});

// =============================
// CALLBACK
// =============================
app.get("/callback", async (req, res) => {
  try {
    const spotify = createSpotify();

    const { code, state } = req.query;

    if (!code) return res.status(400).send("Missing code");

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    // store ONLY refresh token
    saveRefreshToken(refreshToken);

    console.log(`✅ Spotify linked: ${state}`);

    res.send("Spotify connected ✔ You can close this tab.");
  } catch (err) {
    console.error("Auth error:", err?.body || err.message || err);
    res.status(500).send("Auth failed");
  }
});

// =============================
app.listen(3000, "0.0.0.0", () => {
  const config = loadConfig();

  console.log("🚀 Spotify server running");
  console.log(`Login: ${config.spotify.baseUrl}/login?user=DISCORD_ID`);
});