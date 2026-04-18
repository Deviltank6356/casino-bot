const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addxpboost")
    .setDescription("Add XP multiplier boost")
    .addNumberOption(o =>
      o.setName("multiplier").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes").setRequired(true)
    ),

  async execute(i, client) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "No permission", ephemeral: true });

    const mult = i.options.getNumber("multiplier");
    const mins = i.options.getInteger("minutes");

    xp.addMultiplier(mult, mins * 60000);

    await logAdminAction(client, i, "ADD XP BOOST", `${mult}x for ${mins}m`);

    i.reply(`⭐ Added ${mult}x XP boost for ${mins} min`);
  }
};