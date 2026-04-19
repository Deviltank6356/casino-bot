const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("login")
    .setDescription("Link your Spotify account"),

  async execute(i) {
    const url = `${config.spotify.authUrl}/login?user=${i.user.id}`;

    return i.reply({
      content: `🔗 Click to link Spotify:\n${url}`,
      flags: 64 // ephemeral replacement
    });
  }
};