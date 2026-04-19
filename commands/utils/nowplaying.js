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
      if (!track || track.status === "not_linked") {
        return i.reply({
          content: `❌ ${target.username} has not linked Spotify.`,
          ephemeral: false
        });
      }

      // ❌ error
      if (track.status === "error") {
        return i.reply({
          content: `❌ Couldn't fetch Spotify data for ${target.username}.`,
          ephemeral: false
        });
      }

      // 🎧 nothing playing
      if (track.status === "none") {
        return i.reply({
          content: `🎧 ${target.username} is not listening to anything.`,
          ephemeral: false
        });
      }

      // =============================
      // NORMALISE RESPONSE (IMPORTANT FIX)
      // =============================
      const item = track.item ?? track;

      const name = item.name || track.name || "Unknown Track";

      const artist =
        item.artists?.map(a => a.name).join(", ") ||
        track.artist ||
        "Unknown Artist";

      const url =
        item.external_urls?.spotify ||
        track.url ||
        null;

      const isPlaying =
        track.is_playing ??
        track.isPlaying ??
        false;

      return i.reply({
        content:
          `🎧 **${target.username} is listening to Spotify:**\n` +
          `🎵 **${name}**\n` +
          `👤 ${artist}\n` +
          `🔗 ${url || "No link available"}\n` +
          `${isPlaying ? "🟢 Live" : "⏸️ Paused"}`,
        ephemeral: false
      });

    } catch (err) {
      console.error("NOWPLAYING ERROR:", err);

      return i.reply({
        content: "❌ Spotify system error",
        ephemeral: false
      });
    }
  }
};