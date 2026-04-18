const { SlashCommandBuilder } = require("discord.js");
const { deposit } = require("../../systems/bank");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .addIntegerOption(o => o.setName("amount").setRequired(true))
    .setDescription("Deposit money"),

  async execute(i) {
    const r = deposit(i.user.id, i.options.getInteger("amount"));
    if (r.error) return i.reply(r.error);

    i.reply("🏦 Deposited");
  }
};