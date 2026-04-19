const { SlashCommandBuilder } = require("discord.js");
const { getNowPlaying } = require("../../services/spotify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show Spotify current track"),

  async execute(i) {
    try {
      const track = await getNowPlaying();

      if (!track) {
        return i.reply({
          content: "❌ Spotify not available.",
          ephemeral: true
        });
      }

      if (!track.isPlaying) {
        return i.reply({
          content: "🎧 Nothing is currently playing.",
          ephemeral: true
        });
      }

      return i.reply({
        content:
          `🎧 **Now Playing**\n` +
          `🎵 ${track.name}\n` +
          `👤 ${track.artist}\n` +
          `🔗 ${track.url}`
      });

    } catch (err) {
      console.error("Spotify error:", err);

      return i.reply({
        content: "❌ Spotify system error",
        ephemeral: true
      });
    }
  }
};