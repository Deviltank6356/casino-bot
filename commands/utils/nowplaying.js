const { SlashCommandBuilder } = require("discord.js");
const { nowPlaying } = require("../../services/spotify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show what you're listening to on Spotify"),

  async execute(i) {
    try {
      const track = await nowPlaying();

      if (!track || track.error) {
        return i.reply({
          content: "❌ Spotify is not connected or not configured correctly.",
          ephemeral: true
        });
      }

      return i.reply({
        content:
          `🎧 **Now Playing**\n` +
          `🎵 ${track.name}\n` +
          `👤 ${track.artist}\n` +
          `🔗 ${track.url}\n` +
          `▶️ ${track.isPlaying ? "Playing" : "Paused"}`
      });

    } catch (err) {
      console.error("Spotify error:", err);

      return i.reply({
        content: "❌ Spotify system error.",
        ephemeral: true
      });
    }
  }
};