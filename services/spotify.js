const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

let lastRefresh = 0;

// =============================
// INIT SPOTIFY CLIENT
// =============================
const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret
});

// ALWAYS ensure refresh token is applied
spotify.setRefreshToken(config.spotify.refreshToken);

// =============================
// DEBUG LOGGER
// =============================
function logSpotifyError(err) {
  console.error("❌ SPOTIFY FULL DEBUG:");
  console.dir(err, { depth: 5 });
}

// =============================
// REFRESH TOKEN
// =============================
async function refreshToken() {
  try {
    const refreshToken = config.spotify.refreshToken;

    if (!refreshToken) {
      console.error("❌ Missing Spotify refresh token in config");
      return false;
    }

    const now = Date.now();

    if (now - lastRefresh < 300000) return true;

    const data = await spotify.refreshAccessToken();

    const accessToken = data?.body?.access_token;

    if (!accessToken) {
      console.error("❌ No access token returned from Spotify");
      return false;
    }

    spotify.setAccessToken(accessToken);

    lastRefresh = now;

    return true;

  } catch (err) {
    logSpotifyError(err);
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

  } catch (err) {
    logSpotifyError(err);
    return { status: "error" };
  }
}

module.exports = { getNowPlaying };