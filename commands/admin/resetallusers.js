const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexpboost")
    .setDescription("Remove an active XP multiplier boost")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("XP multiplier (e.g. 2 = 2x)")
        .setRequired(true)
    ),

  async execute(i, client) {
    try {
      if (!isAdmin(i.user.id)) {
        return i.reply({ content: "No permission", ephemeral: true });
      }

      const mult = i.options.getNumber("multiplier");

      if (!mult || mult <= 0) {
        return i.reply({
          content: "❌ Invalid multiplier",
          ephemeral: true
        });
      }

      xp.removeMultiplier(mult);

      // safe logging (prevents crash)
      await logAdminAction(
        client,
        i,
        "REMOVE XP BOOST",
        `Removed ${mult}x XP boost`
      ).catch(err => console.error("LOG ERROR:", err));

      return i.reply(`❌ Removed ${mult}x XP boost`);

    } catch (err) {
      console.error("REMOVEXPBOOST ERROR:", err);

      return i.reply({
        content: "❌ Error removing XP boost",
        ephemeral: true
      });
    }
  }
};