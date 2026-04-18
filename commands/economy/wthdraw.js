const { SlashCommandBuilder } = require("discord.js");
const { withdraw } = require("../../systems/bank");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .addIntegerOption(o => o.setName("amount").setRequired(true))
    .setDescription("Withdraw money"),

  async execute(i) {
    const r = withdraw(i.user.id, i.options.getInteger("amount"));
    if (r.error) return i.reply(r.error);

    i.reply("💰 Withdrawn");
  }
};