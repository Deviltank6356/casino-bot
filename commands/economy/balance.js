const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance"),

  async execute(i) {
    try {
      const user = getUser(i.user.id);

      if (!user?.started) {
        return i.reply({ content: "❌ Run /start first", ephemeral: true });
      }

      return i.reply(
        `💰 Money: ${user.money ?? 0}\n` +
        `🏦 Bank: ${user.bank ?? 0}\n` +
        `⭐ XP: ${user.xp ?? 0}`
      );

    } catch (err) {
      console.error("BALANCE ERROR:", err);
      return i.reply({ content: "❌ Failed to fetch balance", ephemeral: true });
    }
  }
};