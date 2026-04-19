const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Begin your journey"),

  async execute(interaction) {
    const user = getUser(interaction.user.id);

    // 🔒 HARD BLOCK (DO NOT TRUST ANY OTHER CHECKS)
    if (user.started === 1) {
      return interaction.reply({
        content: "❌ You already ran /start",
        ephemeral: true
      });
    }

    // set values
    user.money = config.startingMoney ?? 1000;
    user.bank = config.startingBank ?? 500;
    user.xp = 0;
    user.level = 0;

    user.started = 1;

    saveUser(user);

    return interaction.reply({
      content:
        "🎉 Started!\n" +
        `💰 Wallet: ${user.money}\n` +
        `🏦 Bank: ${user.bank}`,
      ephemeral: true
    });
  }
};