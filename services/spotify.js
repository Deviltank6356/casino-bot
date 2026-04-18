const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

async function refresh() {
  const data = await spotify.refreshAccessToken();
  spotify.setAccessToken(data.body.access_token);
}

async function nowPlaying() {
  try {
    await refresh();

    const res = await spotify.getMyCurrentPlayingTrack();

    if (!res.body || !res.body.item) return null;

    const track = res.body.item;

    return {
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      url: track.external_urls.spotify,
      isPlaying: res.body.is_playing
    };

  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { nowPlaying };