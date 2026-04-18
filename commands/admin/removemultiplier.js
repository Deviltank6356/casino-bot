const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const money = require("../../systems/multipliers/moneyMultiplier");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoneyboost")
    .setDescription("Remove a money multiplier boost")
    .addNumberOption(o => o.setName("multiplier").setRequired(true)),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply("No permission");

    money.removeMultiplier(i.options.getNumber("multiplier"));

    i.reply("💰 Boost removed");
  }
};