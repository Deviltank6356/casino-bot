const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("login")
    .setDescription("Link your Spotify account"),

  async execute(i) {
    const baseUrl = config.spotify.baseUrl; 
    // example: https://xxxx.trycloudflare.com

    if (!baseUrl) {
      return i.reply({
        content: "❌ Spotify baseUrl not set in config.json",
        flags: 64
      });
    }

    const url = `${baseUrl}/login?user=${i.user.id}`;

    return i.reply({
      content: `🔗 Click to link Spotify:\n${url}`,
      flags: 64
    });
  }
};