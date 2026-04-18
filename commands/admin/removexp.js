const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");

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