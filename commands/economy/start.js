const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Begin your journey and receive starting bonus"),

  async execute(interaction) {
    const user = getUser(interaction.user.id);

    if (user.money > 0 || user.xp > 0)
      return interaction.reply("You have already started!");

    user.money = config.startingMoney;
    saveUser(user);

    interaction.reply(
      "🎉 Welcome to the casino!\n" +
      `💰 You received ${config.startingMoney} starting money.\n` +
      "Use /balance to check your money and /blackjack, /slots, /roulette to play.\n" +
      "New players earn double money for 1 week or until they reach 50k!"
    );
  }
};