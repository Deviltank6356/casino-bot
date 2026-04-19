const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");
const { getUser } = require("../db");
const client = require("../client"); // your discord client

let lastRefresh = 0;
let lastTrackMap = new Map(); // userId → trackId

// =============================
// INIT CLIENT
// =============================
const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

// apply refresh token immediately
if (config.spotify.refreshToken) {
  spotify.setRefreshToken(config.spotify.refreshToken);
}

// =============================
// INIT SPOTIFY
// =============================
async function initSpotify() {
  try {
    if (!config.spotify.refreshToken) {
      console.error("❌ Missing refresh token");
      return;
    }

    const data = await spotify.refreshAccessToken();
    const token = data?.body?.access_token;

    if (!token) {
      console.error("❌ Failed to init Spotify");
      return;
    }

    spotify.setAccessToken(token);
    lastRefresh = Date.now();

    console.log("✅ Spotify initialized");

  } catch (err) {
    console.error("❌ Spotify init failed:", err?.message || err);
  }
}

initSpotify();

// =============================
// REFRESH TOKEN (SAFE)
// =============================
async function refreshToken() {
  try {
    const now = Date.now();

    if (!spotify.getRefreshToken()) return false;

    if (now - lastRefresh < 300000 && spotify.getAccessToken()) {
      return true;
    }

    const data = await spotify.refreshAccessToken();
    const token = data?.body?.access_token;

    if (!token) return false;

    spotify.setAccessToken(token);
    lastRefresh = now;

    return true;

  } catch (err) {
    console.error("Spotify refresh error:", err?.message || err);
    return false;
  }
}

// =============================
// FETCH CURRENT TRACK (RAW)
// =============================
async function fetchTrack() {
  const res = await spotify.getMyCurrentPlayingTrack();

  if (!res?.body) return null;
  if (!res.body.item) return null;

  return res.body;
}

// =============================
// REAL-TIME LOOP (THIS IS THE KEY)
// =============================
async function tick() {
  try {
    await refreshToken();

    const users = Array.from(lastTrackMap.keys());

    for (const userId of users) {
      const user = getUser(userId);

      if (!user?.spotifyLinked) continue;

      const trackData = await fetchTrack();
      if (!trackData?.item) continue;

      const newId = trackData.item.id;
      const oldId = lastTrackMap.get(userId);

      // no change → ignore
      if (newId === oldId) continue;

      lastTrackMap.set(userId, newId);

      const channel = client.channels.cache.get(user.lastChannelId);
      if (!channel) continue;

      channel.send({
        content:
          `🎧 **Live Now Playing**\n` +
          `👤 <@${userId}>\n` +
          `🎵 ${trackData.item.name}\n` +
          `🎤 ${trackData.item.artists.map(a => a.name).join(", ")}`
      });
    }

  } catch (err) {
    console.error("Spotify tick error:", err?.message || err);
  }
}

// run every 15 seconds (REAL-TIME FEEL)
setInterval(tick, 15000);

// =============================
// REGISTER USER FOR LIVE UPDATES
// =============================
function registerUser(userId) {
  lastTrackMap.set(userId, null);
}

// =============================
// EXPORTS
// =============================
module.exports = {
  registerUser
};