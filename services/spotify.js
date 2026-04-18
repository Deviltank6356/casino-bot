const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

async function refreshToken() {
  const data = await spotify.refreshAccessToken();
  spotify.setAccessToken(data.body.access_token);
}

async function getNowPlaying() {
  try {
    await refreshToken();

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res.body || !res.body.item) {
      return {
        isPlaying: false,
        text: "Nothing currently playing"
      };
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
    return {
      isPlaying: false,
      text: "Spotify API error"
    };
  }
}

module.exports = { getNowPlaying };