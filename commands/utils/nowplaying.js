const { SlashCommandBuilder } = require("discord.js");
const { nowPlaying } = require("../../services/spotify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show what you're listening to on Spotify"),

  async execute(i) {
    const track = await nowPlaying();

    if (!track)
      return i.reply("❌ You are not listening to anything on Spotify");

    i.reply({
      content:
        `🎧 **Now Playing**\n` +
        `🎵 ${track.name}\n` +
        `👤 ${track.artist}\n` +
        `🔗 ${track.url}\n` +
        `▶️ ${track.isPlaying ? "Playing" : "Paused"}`
    });
  }
};