const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");

const app = express();

const CONFIG_PATH = path.join(__dirname, "../config.json");

// =============================
// LOAD CONFIG SAFELY (FRESH READ EACH TIME)
// =============================
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

// =============================
// SPOTIFY CLIENT (static setup only)
// =============================
const config = loadConfig();

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri
});

// =============================
// SAFE CONFIG UPDATE (ONLY PARTIAL WRITE)
// =============================
function saveSpotifyData({ refreshToken }) {
  const cfg = loadConfig(); // ALWAYS fresh file

  cfg.spotify = {
    ...cfg.spotify,
    refreshToken
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// =============================
// LOGIN ROUTE
// =============================
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const state = req.query.user || "unknown";

  const url = spotify.createAuthorizeURL(scopes, state);
  res.redirect(url);
});

// =============================
// CALLBACK ROUTE
// =============================
app.get("/callback", async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) return res.status(400).send("❌ OAuth denied");
    if (!code) return res.status(400).send("❌ Missing code");

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    // 🔥 SAFE SAVE (does NOT delete baseUrl or anything else)
    saveSpotifyData({ refreshToken });

    console.log("✅ Spotify linked successfully");

    res.send("Spotify connected ✔ You can close this tab.");

  } catch (err) {
    console.error("❌ Spotify auth error:", err?.body || err.message || err);
    res.status(500).send("Auth failed");
  }
});

// =============================
// REFRESH TOKEN (SAFE)
// =============================
async function refreshAccessToken() {
  try {
    const cfg = loadConfig();

    spotify.setRefreshToken(cfg.spotify.refreshToken);

    const data = await spotify.refreshAccessToken();

    const accessToken = data.body.access_token;
    spotify.setAccessToken(accessToken);

    console.log("🔄 Access token refreshed");

    return accessToken;

  } catch (err) {
    console.error("❌ Refresh failed:", err.message);
    return null;
  }
}

// =============================
// START SERVER
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify Auth running on port 3000");
  console.log("➡ Login: http://localhost:3000/login");
});

// =============================
module.exports = {
  spotify,
  refreshAccessToken
};