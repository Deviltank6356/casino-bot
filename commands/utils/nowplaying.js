const { SlashCommandBuilder } = require("discord.js");
const { getNowPlaying } = require("../../services/spotify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show Spotify current track"),

  async execute(i) {
    try {
      const track = await getNowPlaying();

      // ❌ Spotify error (token / API / config issue)
      if (!track || track.status === "error") {
        return i.reply({
          content: "❌ Spotify connection error. Try relinking.",
          flags: 64 // replaces deprecated ephemeral
        });
      }

      // 🎧 Nothing playing (NORMAL case)
      if (track.status === "none") {
        return i.reply({
          content: "🎧 Nothing is currently playing.",
          flags: 64
        });
      }

      // ⏸️ Paused
      if (!track.isPlaying) {
        return i.reply({
          content:
            `⏸️ **Paused**\n` +
            `🎵 ${track.name}\n` +
            `👤 ${track.artist}\n` +
            `🔗 ${track.url || "No link"}`,
          flags: 64
        });
      }

      // ✅ Playing
      return i.reply({
        content:
          `🎧 **Now Playing**\n` +
          `🎵 ${track.name}\n` +
          `👤 ${track.artist}\n` +
          `🔗 ${track.url || "No link"}\n` +
          `🟢 Playing`
      });

    } catch (err) {
      console.error("Spotify command error:", err);

      return i.reply({
        content: "❌ Spotify system error",
        flags: 64
      });
    }
  }
};