const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const isAdmin = require(path.join(__dirname, "../../utils/isAdmin"));
const money = require(path.join(__dirname, "../../systems/multipliers/XPMultiplier"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexpboost")
    .setDescription("Remove XP multiplier boost")
    .addNumberOption(o => o.setName("multiplier").setRequired(true)),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply("No permission");

    xp.removeMultiplier(i.options.getNumber("multiplier"));

    i.reply("⭐ Boost removed");
  }
};