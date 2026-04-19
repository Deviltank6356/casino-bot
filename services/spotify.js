const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

let lastRefresh = 0;

// =============================
// REFRESH TOKEN (SAFE + CORRECT)
// =============================
async function refreshToken() {
  try {
    if (!config.spotify.refreshToken) return false;

    const now = Date.now();

    // prevent spam refresh
    if (now - lastRefresh < 300000) return true;

    const data = await spotify.refreshAccessToken();

    const accessToken = data.body.access_token;

    spotify.setAccessToken(accessToken);

    lastRefresh = now;

    return true;

  } catch (err) {
    console.error("Spotify refresh error:", err?.body || err.message);
    return false;
  }
}

// =============================
// NOW PLAYING
// =============================
async function getNowPlaying() {
  try {
    const ok = await refreshToken();
    if (!ok) return null;

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res?.body?.item) return null;

    const item = res.body.item;

    return {
      name: item.name,
      artist: item.artists?.map(a => a.name).join(", ") || "Unknown",
      url: item.external_urls?.spotify || null,
      isPlaying: res.body.is_playing ?? false
    };

  } catch (err) {
    console.error("Spotify error:", err?.body || err.message);
    return null;
  }
}

module.exports = { getNowPlaying };