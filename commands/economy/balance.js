const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance"),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);

      return interaction.reply(
        `💰 Money: ${user.money ?? 0}\n` +
        `🏦 Bank: ${user.bank ?? 0}\n` +
        `⭐ XP: ${user.xp ?? 0}`
      );

    } catch (err) {
      console.error("BALANCE ERROR:", err);
      return interaction.reply({
        content: "❌ Failed to fetch balance",
        ephemeral: true
      });
    }
  }
};