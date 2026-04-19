const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Begin your journey and receive a starting bonus"),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);

      // =============================
      // HARD BLOCK (FINAL SAFE CHECK)
      // =============================
      if (user.started === 1) {
        return interaction.reply({
          content: "❌ You have already used /start.",
          ephemeral: true
        });
      }

      // =============================
      // LOCK FIRST (prevents spam exploit)
      // =============================
      user.started = 1;
      saveUser(user);

      // =============================
      // GIVE REWARD (ONLY ONCE)
      // =============================
      user.money = config.startingMoney ?? 1000;
      user.bank = config.startingBank ?? 500;
      user.xp = config.startingXP ?? 0;
      user.level = config.startingLevel ?? 0;

      saveUser(user);

      return interaction.reply(
        "🎉 **Welcome to the casino!**\n" +
        `💰 Wallet: ${user.money}\n` +
        `🏦 Bank: ${user.bank}\n` +
        "━━━━━━━━━━━━━━\n" +
        "You can now use:\n" +
        "🎰 /slots\n🎡 /roulette\n🃏 /blackjack\n💰 /balance\n"
      );

    } catch (err) {
      console.error("START ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Failed to start",
          ephemeral: true
        });
      }
    }
  }
};