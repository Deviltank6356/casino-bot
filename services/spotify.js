const SpotifyWebApi = require("spotify-web-api-node");
const { getUser } = require("../db");
const Database = require("better-sqlite3");
const path = require("path");
const client = require("../client");

const db = new Database(path.join(__dirname, "../casino.db"));

let lastTrackMap = new Map();

// =============================
// GET USER TOKEN
// =============================
function getRefreshToken(userId) {
  const row = db
    .prepare("SELECT refreshToken FROM spotify_tokens WHERE userId = ?")
    .get(userId);

  return row?.refreshToken || null;
}

// =============================
// CREATE SPOTIFY CLIENT PER USER
// =============================
function createSpotifyClient(refreshToken) {
  const spotify = new SpotifyWebApi({
    clientId: require("../config.json").spotify.clientId,
    clientSecret: require("../config.json").spotify.clientSecret
  });

  spotify.setRefreshToken(refreshToken);
  return spotify;
}

// =============================
// GET CURRENT TRACK FOR USER
// =============================
async function getTrackForUser(userId) {
  const refreshToken = getRefreshToken(userId);
  if (!refreshToken) return null;

  const spotify = createSpotifyClient(refreshToken);

  try {
    const data = await spotify.refreshAccessToken();
    const accessToken = data?.body?.access_token;

    if (!accessToken) return null;

    spotify.setAccessToken(accessToken);

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res?.body?.item) return null;

    return {
      id: res.body.item.id,
      name: res.body.item.name,
      artists: res.body.item.artists.map(a => a.name).join(", "),
      url: res.body.item.external_urls.spotify,
      isPlaying: res.body.is_playing
    };

  } catch (err) {
    console.error("Spotify user error:", err?.message || err);
    return null;
  }
}

// =============================
// REAL-TIME LOOP
// =============================
async function tick() {
  const users = Array.from(lastTrackMap.keys());

  for (const userId of users) {
    const user = getUser(userId);
    if (!user) continue;

    const track = await getTrackForUser(userId);
    if (!track) continue;

    const old = lastTrackMap.get(userId);

    if (old === track.id) continue;

    lastTrackMap.set(userId, track.id);

    const channel = client.channels.cache.get(user.lastChannelId);
    if (!channel) continue;

    channel.send({
      content:
        `🎧 **Live Now Playing**\n` +
        `👤 <@${userId}>\n` +
        `🎵 ${track.name}\n` +
        `🎤 ${track.artists}\n` +
        `🔗 ${track.url}`
    });
  }
}

// run every 15s
setInterval(tick, 15000);

// =============================
// REGISTER USER
// =============================
function registerUser(userId) {
  lastTrackMap.set(userId, null);
}

module.exports = { registerUser };