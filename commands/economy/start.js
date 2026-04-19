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

      if (user.started) {
        return interaction.reply({
          content: "❌ You already started!",
          ephemeral: true
        });
      }

      user.money = config.startingMoney ?? 0;
      user.xp = config.startingXP ?? 0;
      user.level = config.startingLevel ?? 0;
      user.bank = config.startingBank ?? 0;
      user.started = 1;

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