const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const path = require("path");
const Database = require("better-sqlite3");
const config = require("./config.json");

const app = express();
const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// TABLE (CLEAN + SAFE)
// =============================
db.prepare(`
CREATE TABLE IF NOT EXISTS spotify_tokens (
  userId TEXT PRIMARY KEY,
  refreshToken TEXT NOT NULL,
  accessToken TEXT,
  expiresAt INTEGER
);
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
// LOGIN ROUTE
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
    userId,
    true
  );

  res.redirect(url);
});

// =============================
// CALLBACK ROUTE (FIXED FLOW)
// =============================
app.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    // exchange code → tokens
    const data = await spotify.authorizationCodeGrant(code);

    const refreshToken = data?.body?.refresh_token;
    const accessToken = data?.body?.access_token;
    const expiresIn = data?.body?.expires_in;

    if (!refreshToken || !accessToken) {
      return res.status(500).send("Invalid Spotify response");
    }

    // IMPORTANT: set BOTH tokens before verification
    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    // VERIFY ACCOUNT
    const me = await spotify.getMe().catch(() => null);

    if (!me) {
      return res.status(500).send("Spotify verification failed");
    }

    const expiresAt = Date.now() + expiresIn * 1000;

    // SAVE PER USER
    db.prepare(`
      INSERT OR REPLACE INTO spotify_tokens
      (userId, refreshToken, accessToken, expiresAt)
      VALUES (?, ?, ?, ?)
    `).run(
      state,
      refreshToken,
      accessToken,
      expiresAt
    );

    console.log(`✅ Spotify linked: ${state}`);

    res.send("Spotify linked successfully ✔ You can close this tab.");

  } catch (err) {
    console.error("❌ Spotify auth error:");
    console.dir({
      message: err?.message,
      body: err?.body,
      status: err?.statusCode
    }, { depth: 5 });

    res.status(500).send("Auth failed");
  }
});

// =============================
// HEALTH CHECK
// =============================
app.get("/", (req, res) => {
  res.send("Spotify auth server running ✔");
});

// =============================
// START SERVER
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify auth server running");
  console.log(`Login URL: https://echo-told-eleven-collection.trycloudflare.com/login`);
});