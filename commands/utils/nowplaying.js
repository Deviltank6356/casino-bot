const { SlashCommandBuilder } = require("discord.js");
const { getUserSpotify } = require("../../services/spotifyUsers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show what a user is listening to on Spotify")
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("User to check (defaults to you)")
        .setRequired(false)
    ),

  async execute(i) {
    try {
      const target = i.options.getUser("user") || i.user;

      const track = await getUserSpotify(target.id);

      // ❌ not linked OR service error
      if (!track || track.status === "not_linked") {
        return i.reply({
          content: `❌ ${target.username} has not linked Spotify.`,
          flags: 64
        });
      }

      if (track.status === "error") {
        return i.reply({
          content: `❌ Couldn't fetch Spotify data for ${target.username}.`,
          flags: 64
        });
      }

      // 🎧 nothing playing
      if (track.status === "none") {
        return i.reply({
          content: `🎧 ${target.username} is not listening to anything.`,
          flags: 64
        });
      }

      // ✅ playing
      return i.reply({
        content:
          `🎧 **${target.username} is listening to:**\n` +
          `🎵 ${track.name}\n` +
          `👤 ${track.artist}\n` +
          `🔗 ${track.url || "No link"}\n` +
          `${track.isPlaying ? "🟢 Live" : "⏸️ Paused"}`,
        flags: 64
      });

    } catch (err) {
      console.error("NOWPLAYING ERROR:", err);

      return i.reply({
        content: "❌ Spotify system error",
        flags: 64
      });
    }
  }
};