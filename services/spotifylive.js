const { getUser } = require("../db");
const { getNowPlayingRaw } = require("./spotifyCore"); 
const client = require("../client"); // your discord client

const liveCache = new Map();

async function checkUser(userId) {
  const user = getUser(userId);

  if (!user.spotifyRefresh) return;

  const track = await getNowPlayingRaw(user.spotifyRefresh);
  if (!track?.item) return;

  const currentId = track.item.id;
  const lastId = liveCache.get(userId);

  // if same song → ignore
  if (lastId === currentId) return;

  liveCache.set(userId, currentId);

  const channel = client.channels.cache.get(user.lastChannelId);
  if (!channel) return;

  channel.send(
    `🎧 **${userId} is now listening to:**\n` +
    `🎵 ${track.item.name} - ${track.item.artists.map(a => a.name).join(", ")}`
  );
}

// loop
setInterval(() => {
  const users = [...liveCache.keys()];
  users.forEach(checkUser);
}, 15000); // every 15s

module.exports = {};