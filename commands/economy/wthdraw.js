const { SlashCommandBuilder } = require("discord.js");
const { withdraw } = require("../../systems/bank");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw money from your bank")
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount of money to withdraw")
        .setRequired(true)
    ),

  async execute(i) {
    const amount = i.options.getInteger("amount");

    const result = withdraw(i.user.id, amount);

    if (result?.error) {
      return i.reply({ content: result.error, ephemeral: true });
    }

    return i.reply("💰 Withdrawn successfully");
  }
};