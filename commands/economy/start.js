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

      // 🔒 HARD BLOCK: already started
      if (Number(user.started) === 1) {
        return interaction.reply({
          content: "❌ You already started!",
          ephemeral: true
        });
      }

      // 🎯 INITIALISE USER (ONLY ONCE EVER)
      user.money = config.startingMoney ?? 1000;
      user.xp = config.startingXP ?? 0;
      user.level = config.startingLevel ?? 0;
      user.bank = config.startingBank ?? 0;

      // 🔒 PERMANENT FLAG
      user.started = 1;

      // SAVE TO DB (CRITICAL)
      saveUser(user);

      return interaction.reply(
        "🎉 **Welcome to the casino!**\n" +
        `💰 Starting money: ${user.money}\n` +
        "━━━━━━━━━━━━━━\n" +
        "You can now use:\n" +
        "🎰 /slots\n🎡 /roulette\n🃏 /blackjack\n💰 /balance\n"
      );

    } catch (err) {
      console.error("START ERROR:", err);
      return interaction.reply({
        content: "❌ Failed to start",
        ephemeral: true
      });
    }
  }
};