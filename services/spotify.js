const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

let lastRefresh = 0;

// =============================
// REFRESH TOKEN (SAFE)
// =============================
async function refreshToken() {
  try {
    if (!config.spotify.refreshToken) {
      console.error("❌ Missing Spotify refresh token in config");
      return false;
    }

    const now = Date.now();

    if (now - lastRefresh < 300000) return true;

    const data = await spotify.refreshAccessToken();

    if (!data?.body?.access_token) {
      console.error("❌ Spotify refresh failed: no access token returned");
      return false;
    }

    spotify.setAccessToken(data.body.access_token);

    lastRefresh = now;

    return true;

  } catch (err) {
    console.error("❌ Spotify refresh error FULL:", {
      message: err?.message,
      body: err?.body,
      status: err?.statusCode,
      stack: err?.stack
    });

    return false;
  }
}

// =============================
// NOW PLAYING
// =============================
async function getNowPlaying() {
  try {
    const ok = await refreshToken();

    if (!ok) return { status: "error" };

    if (!spotify.getAccessToken()) {
      const refreshed = await refreshToken();
      if (!refreshed) return { status: "error" };
    }

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res?.body?.item) {
      return { status: "none" };
    }

    const item = res.body.item;

    return {
      status: "ok",
      name: item.name,
      artist: item.artists?.map(a => a.name).join(", ") || "Unknown",
      url: item.external_urls?.spotify || null,
      isPlaying: Boolean(res.body.is_playing)
    };

  function logSpotifyError(err) {
  console.error("❌ SPOTIFY FULL DEBUG:");
  console.error(JSON.stringify({
    message: err?.message,
    body: err?.body,
    statusCode: err?.statusCode,
    stack: err?.stack,
    raw: err
  }, null, 2));
}

module.exports = { getNowPlaying };