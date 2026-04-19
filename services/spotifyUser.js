const SpotifyWebApi = require("spotify-web-api-node");

// in-memory (replace with DB later)
const userTokens = new Map();

function setUserTokens(userId, refreshToken) {
  userTokens.set(userId, {
    refreshToken,
    api: new SpotifyWebApi({
      clientId: process.env.SPOTIFY_ID,
      clientSecret: process.env.SPOTIFY_SECRET,
      refreshToken
    })
  });
}

async function getUserSpotify(userId) {
  const data = userTokens.get(userId);
  if (!data) return null;

  try {
    const res = await data.api.getMyCurrentPlayingTrack();
    return res.body;
  } catch {
    return null;
  }
}

module.exports = {
  setUserTokens,
  getUserSpotify
};