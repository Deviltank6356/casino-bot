const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

let lastRefresh = 0;

// =============================
// REFRESH TOKEN (SAFE + DIAGNOSED)
// =============================
async function refreshToken() {
  try {
    // ❌ no refresh token = hard stop
    if (!config.spotify.refreshToken) {
      console.error("❌ Missing Spotify refresh token in config");
      return false;
    }

    const now = Date.now();

    // cooldown to avoid spam refresh
    if (now - lastRefresh < 300000) return true;

    const data = await spotify.refreshAccessToken();

    if (!data?.body?.access_token) {
      console.error("❌ Spotify refresh failed: no access token returned");
      return false;
    }

    const accessToken = data.body.access_token;

    spotify.setAccessToken(accessToken);

    lastRefresh = now;

    return true;

  } catch (err) {
    console.error(
      "❌ Spotify refresh error:",
      err?.body || err?.message || err
    );
    return false;
  }
}

// =============================
// NOW PLAYING (SAFE + EXPLICIT STATES)
// =============================
async function getNowPlaying() {
  try {
    const ok = await refreshToken();

    // 🔥 distinguish real failure vs no token
    if (!ok) {
      return { status: "error" };
    }

    // safety: ensure token exists before API call
    if (!spotify.getAccessToken()) {
      const refreshed = await refreshToken();
      if (!refreshed) return { status: "error" };
    }

    const res = await spotify.getMyCurrentPlayingTrack();

    // nothing playing
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
    console.error(
      "❌ Spotify API error:",
      err?.body || err?.message || err
    );

    return { status: "error" };
  }
}

module.exports = { getNowPlaying };