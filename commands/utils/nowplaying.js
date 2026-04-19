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

      // ❌ not linked
      if (!track) {
        return i.reply({
          content: `❌ ${target.username} has not linked Spotify.`,
          flags: 64
        });
      }

      // 🎧 nothing playing
      if (!track.item) {
        return i.reply({
          content: `🎧 ${target.username} is not listening to anything.`,
          flags: 64
        });
      }

      const song = track.item.name || "Unknown";
      const artist =
        track.item.artists?.map(a => a.name).join(", ") || "Unknown";
      const url = track.item.external_urls?.spotify || null;
      const isPlaying = track.is_playing;

      return i.reply({
        content:
          `🎧 **${target.username} is listening to:**\n` +
          `🎵 ${song}\n` +
          `👤 ${artist}\n` +
          `🔗 ${url || "No link"}\n` +
          `${isPlaying ? "🟢 Live" : "⏸️ Paused"}`,
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