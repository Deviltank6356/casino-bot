const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../config.json");

// =============================
// LOAD CONFIG
// =============================
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

// =============================
// CREATE CLIENT
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
// REFRESH TOKEN
// =============================
async function refreshAccessToken() {
  try {
    const config = loadConfig();

    if (!config.spotify.refreshToken) return null;

    const spotify = createSpotify();

    spotify.setRefreshToken(config.spotify.refreshToken);

    const data = await spotify.refreshAccessToken();

    const accessToken = data.body.access_token;

    spotify.setAccessToken(accessToken);

    return accessToken;
  } catch (err) {
    console.error("Refresh failed:", err.message);
    return null;
  }
}

module.exports = {
  refreshAccessToken
};