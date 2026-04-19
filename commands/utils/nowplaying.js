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

      // =============================
      // NOT LINKED / INVALID RESPONSE
      // =============================
      if (!track) {
        return i.reply({
          content: `❌ ${target.username} has not linked Spotify.`,
          flags: 64
        });
      }

      // =============================
      // NORMALISE OLD + NEW FORMAT
      // =============================
      const status = track.status || "ok";

      // error
      if (status === "error") {
        return i.reply({
          content: `❌ Couldn't fetch Spotify data for ${target.username}.`,
          flags: 64
        });
      }

      // none playing
      if (status === "none") {
        return i.reply({
          content: `🎧 ${target.username} is not listening to anything.`,
          flags: 64
        });
      }

      // =============================
      // SUPPORT BOTH FORMATS:
      // OLD: track.item
      // NEW: track.name
      // =============================
      const item = track.item || track;

      const name = item.name || "Unknown";
      const artist =
        item.artists?.map(a => a.name).join(", ") ||
        track.artist ||
        "Unknown";

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
          `🎧 **${target.username} is listening to:**\n` +
          `🎵 ${name}\n` +
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