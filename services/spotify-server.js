const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../config.json");

const app = express();

// =============================
// LOAD CONFIG SAFELY (NO CACHE)
// =============================
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

// =============================
// SPOTIFY CLIENT (STATIC KEYS ONLY)
// =============================
function createSpotifyClient(config) {
  return new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    redirectUri: config.spotify.redirectUri
  });
}

// =============================
// LOGIN ROUTE
// =============================
app.get("/login", (req, res) => {
  const config = loadConfig();
  const spotify = createSpotifyClient(config);

  const userId = req.query.user;

  if (!userId) {
    return res.status(400).send("Missing Discord user ID");
  }

  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played"
  ];

  const url = spotify.createAuthorizeURL(scopes, userId, true);

  res.redirect(url);
});

// =============================
// CALLBACK ROUTE (SAFE + NO DATA LOSS)
// =============================
app.get("/callback", async (req, res) => {
  try {
    const config = loadConfig();
    const spotify = createSpotifyClient(config);

    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const data = await spotify.authorizationCodeGrant(code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    if (!refreshToken || !accessToken) {
      return res.status(500).send("Invalid Spotify response");
    }

    spotify.setAccessToken(accessToken);

    // optional verification (safe)
    await spotify.getMe().catch(() => null);

    // =============================
    // 🔥 SAFE CONFIG UPDATE (NO KEY LOSS)
    // =============================
    const freshConfig = loadConfig();

    const updatedConfig = {
      ...freshConfig,
      spotify: {
        ...freshConfig.spotify,
        refreshToken // ONLY CHANGE THIS
      }
    };

    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify(updatedConfig, null, 2)
    );

    console.log(`✅ Spotify linked for user: ${state}`);

    res.send("Spotify linked successfully ✔ You can close this tab.");

  } catch (err) {
    console.error("❌ Spotify auth error:", {
      message: err?.message,
      body: err?.body,
      status: err?.statusCode
    });

    res.status(500).send("Auth failed");
  }
});

// =============================
// HEALTH CHECK (FOR CLOUD TUNNELS)
// =============================
app.get("/", (req, res) => {
  res.send("Spotify auth server running ✔");
});

// =============================
// START SERVER
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Spotify auth server running");

  const config = loadConfig();

  console.log(
    `Login URL: ${config.spotify.baseUrl}/login?user=DISCORD_USER_ID`
  );
});