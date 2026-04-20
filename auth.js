const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const path = require("path");
const Database = require("better-sqlite3");
const { runTransaction } = require("./utils/dbQueue"); // 🔒 IMPORTANT

const app = express();

const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// OPTIMISE SQLITE FOR VPS
// =============================
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// =============================
// TABLE
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
function createSpotify() {
  const config = require("./config.json"); // safe here (not inside hot loop)

  return new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    redirectUri: config.spotify.redirectUri
  });
}

// =============================
// LOGIN
// =============================
app.get("/login", (req, res) => {
  const userId = req.query.user;

  if (!userId) {
    return res.status(400).send("Missing Discord user ID");
  }

  const spotify = createSpotify();

  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const url = spotify.createAuthorizeURL(scopes, userId, true);

  return res.redirect(url);
});

// =============================
// CALLBACK (ANTI-EXPLOIT VERSION)
// =============================
app.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code/state");
    }

    const spotify = createSpotify();

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    const expiresIn = data.body.expires_in;

    if (!accessToken || !refreshToken) {
      return res.status(500).send("Invalid Spotify response");
    }

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    const me = await spotify.getMe().catch(() => null);

    if (!me) {
      return res.status(500).send("Spotify verification failed");
    }

    const expiresAt = Date.now() + expiresIn * 1000;

    // =============================
    // 🔒 QUEUED DB WRITE (NO RACE CONDITIONS)
    // =============================
    await runTransaction(() => {
      db.prepare(`
        INSERT INTO spotify_tokens (
          userId,
          refreshToken,
          accessToken,
          expiresAt
        ) VALUES (?, ?, ?, ?)
        ON CONFLICT(userId) DO UPDATE SET
          refreshToken = excluded.refreshToken,
          accessToken = excluded.accessToken,
          expiresAt = excluded.expiresAt
      `).run(
        state,
        refreshToken,
        accessToken,
        expiresAt
      );
    });

    console.log(`✅ Spotify linked: ${state}`);

    return res.send("Spotify linked successfully ✔ You can close this tab.");

  } catch (err) {
    console.error("❌ Spotify auth error:", err?.body || err.message || err);
    return res.status(500).send("Auth failed");
  }
});

// =============================
// HEALTH CHECK
// =============================
app.get("/", (req, res) => {
  res.send("Spotify auth server running ✔");
});

// =============================
// START
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify auth running");
  console.log("Login URL: /login?user=DISCORD_ID");
});