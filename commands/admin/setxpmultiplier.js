const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addxpboost")
    .setDescription("Add XP multiplier boost")
    .addNumberOption(o => o.setName("multiplier").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setRequired(true)),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply("No permission");

    const mult = i.options.getNumber("multiplier");
    const mins = i.options.getInteger("minutes");

    xp.addMultiplier(mult, mins * 60000);

    i.reply(`⭐ Added ${mult}x XP boost for ${mins} min`);
  }
};