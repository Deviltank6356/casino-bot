const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

if (!config?.spotify?.clientId || !config?.spotify?.clientSecret) {
  throw new Error("Missing Spotify credentials in config.json");
}

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

let accessTokenSet = false;
let lastRefresh = 0;

// =============================
// SAFE TOKEN REFRESH
// =============================
async function refreshToken() {
  try {
    const now = Date.now();

    // prevent spam refresh (5 min cooldown)
    if (now - lastRefresh < 5 * 60 * 1000) return;

    if (!config?.spotify?.refreshToken) {
      console.warn("⚠️ No Spotify refresh token set");
      return;
    }

    const data = await spotify.refreshAccessToken();

    if (!data?.body?.access_token) {
      console.warn("⚠️ Invalid Spotify refresh response");
      return;
    }

    spotify.setAccessToken(data.body.access_token);

    accessTokenSet = true;
    lastRefresh = now;

  } catch (err) {
    console.error("Spotify refresh error:", err?.body || err.message || err);
  }
}

// =============================
// NOW PLAYING
// =============================
async function getNowPlaying() {
  try {
    await refreshToken();

    if (!accessTokenSet) {
      return null;
    }

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res?.body?.item) return null;

    const track = res.body.item;

    return {
      isPlaying: res.body.is_playing,
      name: track.name,
      artist: track.artists?.map(a => a.name).join(", ") || "Unknown",
      url: track.external_urls?.spotify || null
    };

  } catch (err) {
    console.error("Spotify error:", err?.body || err.message || err);

    return null;
  }
}

module.exports = { getNowPlaying };