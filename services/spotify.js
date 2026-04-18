const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken,
});

async function refreshToken() {
  try {
    const data = await spotify.refreshAccessToken();
    spotify.setAccessToken(data.body.access_token);
  } catch (err) {
    console.error("Spotify refresh failed:", err.message);
  }
}

async function getPlayback() {
  try {
    await refreshToken();

    const res = await spotify.getMyCurrentPlaybackState();

    if (!res.body || !res.body.item) {
      return {
        playing: false,
        text: "Nothing is currently playing."
      };
    }

    const track = res.body.item;

    return {
      playing: res.body.is_playing,
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      url: track.external_urls.spotify,
    };

  } catch (err) {
    console.error("Spotify API error:", err.message);

    return {
      playing: false,
      text: "Unable to fetch playback (Spotify API blocked or expired token)."
    };
  }
}

module.exports = { getPlayback };