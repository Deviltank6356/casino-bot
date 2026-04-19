const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const config = require("../config.json");

const app = express();

const spotify = new SpotifyWebApi({
  clientId: config.spotify.clientId,
  clientSecret: config.spotify.clientSecret,
  refreshToken: config.spotify.refreshToken
});

let lastRefresh = 0;

// =============================
// REFRESH TOKEN SAFE
// =============================
async function refreshToken() {
  try {
    const now = Date.now();
    if (now - lastRefresh < 300000) return;

    const data = await spotify.refreshAccessToken();
    spotify.setAccessToken(data.body.access_token);

    lastRefresh = now;
  } catch (err) {
    console.error("Spotify refresh error:", err?.body || err.message || err);
  }
}

// =============================
// API ROUTE
// =============================
app.get("/now-playing", async (req, res) => {
  try {
    await refreshToken();

    const data = await spotify.getMyCurrentPlayingTrack();

    if (!data?.body?.item) {
      return res.json({ playing: false });
    }

    const track = data.body.item;

    return res.json({
      playing: data.body.is_playing,
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      url: track.external_urls.spotify
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Spotify failed" });
  }
});

// =============================
// START SERVER (THIS WAS MISSING)
// =============================
app.listen(3000, "0.0.0.0", () => {
  console.log("🎧 Spotify server running on port 3000");
app.get("/", (req, res) => {
  res.send("🎧 Spotify API is running ✔");
});
});