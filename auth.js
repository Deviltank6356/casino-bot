const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const path = require("path");
const Database = require("better-sqlite3");

const config = require("./config.json");

const app = express();
const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// TABLE
// =============================
db.prepare(`
CREATE TABLE IF NOT EXISTS spotify_tokens (
  userId TEXT PRIMARY KEY,
  refreshToken TEXT NOT NULL
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
    true // force consent
  );

  res.redirect(url);
});

// =============================
// CALLBACK ROUTE (FIXED + VERIFIED)
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

    if (!refreshToken || !accessToken) {
      return res.status(500).send("Invalid Spotify response");
    }

    // verify token works (IMPORTANT)
    spotify.setAccessToken(accessToken);

    const test = await spotify.getMe().catch(() => null);

    if (!test) {
      return res.status(500).send("Spotify verification failed");
    }

    // store per user
    db.prepare(`
      INSERT OR REPLACE INTO spotify_tokens (userId, refreshToken)
      VALUES (?, ?)
    `).run(state, refreshToken);

    console.log(`✅ Linked Spotify for user: ${state}`);

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
// START SERVER
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify auth server running");

  console.log(
    `Login URL: https://YOUR-TUNNEL.trycloudflare.com/login?user=DISCORD_USER_ID`
  );
});