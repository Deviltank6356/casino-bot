const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexpboost")
    .setDescription("Remove an active XP multiplier boost")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("XP multiplier to remove (e.g. 2 for 2x)")
        .setRequired(true)
    ),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "No permission", ephemeral: true });

    const mult = i.options.getNumber("multiplier");

    xp.removeMultiplier(mult);

    i.reply(`❌ Removed ${mult}x XP boost`);
  }
};