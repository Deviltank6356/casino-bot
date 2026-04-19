const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const xp = require("../../systems/multipliers/xpMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setxpmultiplier")
    .setDescription("Set the global XP multiplier")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("Multiplier value (e.g. 2 = 2x)")
        .setRequired(true)
    ),

  async execute(i, client) {
    try {
      if (!isAdmin(i.user.id)) {
        return i.reply({ content: "❌ No permission", ephemeral: true });
      }

      const mult = i.options.getNumber("multiplier");

      if (!mult || mult <= 0) {
        return i.reply({
          content: "❌ Invalid multiplier",
          ephemeral: true
        });
      }

      xp.setMultiplier(mult);

      try {
        await logAdminAction(
          client,
          i,
          "SET XP MULTIPLIER",
          `${mult}x`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return i.reply(`⭐ XP multiplier set to ${mult}x`);

    } catch (err) {
      console.error("SETXPMULTIPLIER ERROR:", err);

      return i.reply({
        content: "❌ Error setting XP multiplier",
        ephemeral: true
      });
    }
  }
};