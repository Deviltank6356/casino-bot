const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const path = require("path");
const Database = require("better-sqlite3");

const config = require("./config.json");

const app = express();
const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// DB TABLE (SAFE)
// =============================
db.prepare(`
CREATE TABLE IF NOT EXISTS spotify_tokens (
  userId TEXT PRIMARY KEY,
  refreshToken TEXT
)
`).run();

// =============================
// SPOTIFY CLIENT
// =============================
const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  redirectUri: config.spotify.redirectUri
});

// =============================
// LOGIN ROUTE (DISCORD USER LINKED)
// =============================
app.get("/login", (req, res) => {
  const userId = req.query.user;

  if (!userId) {
    return res.status(400).send("Missing Discord user ID");
  }

  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const url = spotify.createAuthorizeURL(
    scopes,
    userId,   // 🔥 STATE = DISCORD USER ID
    true
  );

  res.redirect(url);
});

// =============================
// CALLBACK ROUTE
// =============================
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state; // Discord user ID

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const data = await spotify.authorizationCodeGrant(code);

    const refreshToken = data.body.refresh_token;

    if (!refreshToken) {
      return res.status(500).send("No refresh token received");
    }

    // =============================
    // SAVE PER USER (IMPORTANT FIX)
    // =============================
    db.prepare(`
      INSERT OR REPLACE INTO spotify_tokens (userId, refreshToken)
      VALUES (?, ?)
    `).run(state, refreshToken);

    res.send("Spotify linked successfully ✔ You can close this tab.");

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

  console.log(
    `Login: https://YOUR-TUNNEL.trycloudflare.com/login?user=DISCORD_USER_ID`
  );
});