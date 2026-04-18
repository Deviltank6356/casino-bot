const { SlashCommandBuilder } = require("discord.js");
const spotify = require("../../services/spotify");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show what you're listening to on Spotify"),

  async execute(i) {
    try {
      if (!spotify.nowPlaying || typeof spotify.nowPlaying !== "function") {
        console.error("❌ Spotify nowPlaying is missing or not a function");
        return i.reply({
          content: "❌ Spotify system is not configured correctly.",
          ephemeral: true
        });
      }

      const track = await spotify.nowPlaying();

      if (!track) {
        return i.reply({
          content: "❌ You are not listening to anything on Spotify.",
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
      console.error("❌ nowplaying command error:", err);

      return i.reply({
        content: "❌ Failed to fetch Spotify data.",
        ephemeral: true
      });
    }
  }
};