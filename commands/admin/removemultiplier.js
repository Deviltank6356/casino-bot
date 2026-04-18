const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const isAdmin = require(path.join(__dirname, "../../utils/isAdmin"));
const money = require(path.join(__dirname, "../../systems/multipliers/moneyMultiplier"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoneyboost")
    .setDescription("Remove a money multiplier boost")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("Multiplier value to remove")
        .setRequired(true)
    ),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "No permission", ephemeral: true });

    money.removeMultiplier(i.options.getNumber("multiplier"));

    i.reply("💰 Boost removed");
  }
};