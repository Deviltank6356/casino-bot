const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("Play roulette")
    .addIntegerOption(o => o.setName("bet").setRequired(true))
    .addIntegerOption(o => o.setName("number").setRequired(true)),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const choice = interaction.options.getInteger("number");

    const user = getUser(interaction.user.id);

    if (user.money < bet)
      return interaction.reply("Not enough money.");

    const result = Math.floor(Math.random() * 37);

    if (result === choice) user.money += bet * 35;
    else user.money -= bet;

    saveUser(user);

    interaction.reply(`🎡 Result: ${result}`);
  }
};