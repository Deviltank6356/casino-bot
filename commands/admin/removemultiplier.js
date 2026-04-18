const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const isAdmin = require(path.join(__dirname, "../../utils/isAdmin"));
const path = require("path");
const money = require(path.join(__dirname, "../../systems/multipliers/moneyMultiplier"));

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