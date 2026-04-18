const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();

const spotify = new SpotifyWebApi({
  clientId: "bf81e117c0314819a3f9877ca8b3f157",
  clientSecret: "d8e2260efcf94c9a874d2c3198263c36",
  redirectUri: "https://79.72.92.17:3000/callback"
});

// STEP 1: login URL
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-read-playback-state"
  ];

  const url = spotify.createAuthorizeURL(scopes);
  res.redirect(url);
});

// STEP 2: callback
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  const data = await spotify.authorizationCodeGrant(code);

  const refreshToken = data.body.refresh_token;

  console.log("YOUR REFRESH TOKEN:");
  console.log(refreshToken);

  res.send("Check console for refresh token");
});

app.listen(3000, () => {
  console.log("Go to http://localhost:3000/login");
});