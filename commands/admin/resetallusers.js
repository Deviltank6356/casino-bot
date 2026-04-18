const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexpboost")
    .setDescription("Remove an active XP multiplier boost")
    .addNumberOption(o =>
      o.setName("multiplier").setDescription("XP multiplier").setRequired(true)
    ),

  async execute(i, client) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "No permission", ephemeral: true });

    const mult = i.options.getNumber("multiplier");

    xp.removeMultiplier(mult);

    await logAdminAction(client, i, "REMOVE XP BOOST", `Removed ${mult}x XP boost`);

    i.reply(`❌ Removed ${mult}x XP boost`);
  }
};