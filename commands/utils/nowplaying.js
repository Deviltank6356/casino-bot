const { SlashCommandBuilder } = require("discord.js");
const { getNowPlaying } = require("../../services/spotify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show Spotify current track"),

  async execute(i) {
    try {
      const track = await getNowPlaying();

      // 🔥 HARD FIX: distinguish "no song" vs "Spotify broken"
      if (track === null) {
        return i.reply({
          content: "🎧 Nothing is currently playing.",
          ephemeral: true
        });
      }

      // extra safety (should rarely happen now)
      if (!track.name || !track.artist) {
        return i.reply({
          content: "❌ Spotify returned incomplete data.",
          ephemeral: true
        });
      }

      return i.reply({
        content:
          `🎧 **Now Playing**\n` +
          `🎵 ${track.name}\n` +
          `👤 ${track.artist}\n` +
          `🔗 ${track.url || "No link"}\n` +
          `${track.isPlaying ? "🟢 Playing" : "⏸️ Paused"}`
      });

    } catch (err) {
      console.error("Spotify command error:", err);

      return i.reply({
        content: "❌ Spotify system error (check logs)",
        ephemeral: true
      });
    }
  }
};