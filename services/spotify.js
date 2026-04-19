const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

let lastRefresh = 0;

async function refreshToken() {
  try {
    const now = Date.now();

    // prevent spam refreshing (important stability fix)
    if (now - lastRefresh < 300000) return;

    const data = await spotify.refreshAccessToken();
    spotify.setAccessToken(data.body.access_token);

    lastRefresh = now;
  } catch (err) {
    console.error("Spotify refresh error:", err?.body || err.message || err);
  }
}

async function getNowPlaying() {
  try {
    await refreshToken();

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res?.body?.item) {
      return null; // cleaner handling
    }

    const track = res.body.item;

    return {
      isPlaying: res.body.is_playing,
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      url: track.external_urls.spotify
    };
  } catch (err) {
    console.error("Spotify error:", err?.body || err.message || err);

    return null;
  }
}

module.exports = { getNowPlaying };