const SpotifyWebApi = require("spotify-web-api-node");

// in-memory cache (replace with DB later)
const userTokens = new Map();

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
}

// =============================
// REFRESH TOKEN SAFELY
// =============================
async function refreshUser(userId, data) {
  try {
    const now = Date.now();

    // avoid spam refresh
    if (now - data.lastRefresh < 300000 && data.accessToken) {
      return true;
    }

    const res = await data.api.refreshAccessToken();

    const token = res?.body?.access_token;
    if (!token) return false;

    data.api.setAccessToken(token);
    data.accessToken = token;
    data.lastRefresh = now;

    return true;
  } catch {
    return false;
  }
}

// =============================
// GET CURRENT TRACK (REAL-TIME SAFE)
// =============================
async function getUserSpotify(userId) {
  const data = userTokens.get(userId);
  if (!data) return null;

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
      isPlaying: Boolean(res.body.is_playing)
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