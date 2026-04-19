const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("login")
    .setDescription("Link your Spotify account"),

  async execute(i) {
    const baseUrl = config.spotify?.baseUrl;

    if (!baseUrl || typeof baseUrl !== "string") {
      return i.reply({
        content: "❌ Spotify baseUrl is missing in config.json",
        flags: 64
      });
    }

    const cleanBase = baseUrl.replace(/\/$/, ""); // remove trailing slash
    const url = `${cleanBase}/login?user=${i.user.id}`;

    return i.reply({
      content: `🔗 Click to link Spotify:\n${url}`,
      flags: 64
    });
  }
};