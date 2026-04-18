const { SlashCommandBuilder } = require("discord.js");
const { deposit } = require("../../systems/bank");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit money into your bank")
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount of money to deposit")
        .setRequired(true)
    ),

  async execute(i) {
    const amount = i.options.getInteger("amount");

    const result = deposit(i.user.id, amount);

    if (result?.error) {
      return i.reply({ content: result.error, ephemeral: true });
    }

    return i.reply("🏦 Deposited successfully");
  }
};