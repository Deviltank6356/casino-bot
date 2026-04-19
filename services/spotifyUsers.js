const SpotifyWebApi = require("spotify-web-api-node");

// in-memory cache (TEMP ONLY — restarts will wipe it)
const userTokens = new Map();

/**
 * Store user tokens after OAuth login
 */
function setUserTokens(userId, refreshToken) {
  const api = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    refreshToken
  });

  userTokens.set(userId, {
    refreshToken,
    accessToken: null,
    api,
    lastRefresh: 0
  });

  console.log(`✅ Spotify linked in memory: ${userId}`);
}

/**
 * Refresh access token safely
 */
async function refreshUser(userId, data) {
  try {
    const now = Date.now();

    // prevent spam refresh
    if (data.accessToken && now - data.lastRefresh < 300000) {
      return true;
    }

    const res = await data.api.refreshAccessToken();
    const token = res?.body?.access_token;

    if (!token) return false;

    data.api.setAccessToken(token);
    data.accessToken = token;
    data.lastRefresh = now;

    return true;
  } catch (err) {
    console.error("Spotify refresh failed:", err?.body || err.message || err);
    return false;
  }
}

/**
 * Get current playback
 */
async function getUserSpotify(userId) {
  const data = userTokens.get(userId);

  // 🔴 THIS is what your bot is hitting
  if (!data) {
    return { status: "not_linked" };
  }

  try {
    await refreshUser(userId, data);

    const res = await data.api.getMyCurrentPlayingTrack();

    if (!res?.body?.item) {
      return { status: "none" };
    }

    const item = res.body.item;

    return {
      status: "ok",
      name: item.name,
      artist: item.artists?.map(a => a.name).join(", ") || "Unknown",
      url: item.external_urls?.spotify || null,
      isPlaying: res.body.is_playing
    };

  } catch (err) {
    console.error("Spotify fetch error:", err?.body || err.message || err);
    return { status: "error" };
  }
}

module.exports = {
  setUserTokens,
  getUserSpotify
};