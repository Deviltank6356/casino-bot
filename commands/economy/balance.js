const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance"),

  async execute(i) {
    const user = getUser(i.user.id);

    return i.reply(
      `💰 Money: ${user.money}\n` +
      `🏦 Bank: ${user.bank}\n` +
      `⭐ XP: ${user.xp}`
    );
  }
};