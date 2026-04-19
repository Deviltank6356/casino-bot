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
    if (!config.spotify.refreshToken) return;

    const now = Date.now();
    if (now - lastRefresh < 300000) return;

    const data = await spotify.refreshAccessToken();

    spotify.setAccessToken(data.body.access_token);

    lastRefresh = now;

  } catch (err) {
    console.error("Spotify refresh error:", err?.body || err.message);
  }
}

async function getNowPlaying() {
  try {
    await refreshToken();

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res.body?.item) return null;

    const t = res.body.item;

    return {
      name: t.name,
      artist: t.artists.map(a => a.name).join(", "),
      url: t.external_urls.spotify,
      isPlaying: res.body.is_playing
    };

  } catch (err) {
    console.error("Spotify error:", err?.body || err.message);
    return null;
  }
}

module.exports = { getNowPlaying };