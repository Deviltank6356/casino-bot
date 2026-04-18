const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const money = require("../../systems/multipliers/moneyMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoneyboost")
    .setDescription("Remove a money multiplier boost")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("Multiplier (e.g. 2 = 2x)")
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

      money.removeMultiplier(mult);

      // SAFE LOGGING (won't break command)
      try {
        await logAdminAction(
          client,
          i,
          "REMOVE MONEY BOOST",
          `Removed ${mult}x money boost`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return i.reply("💰 Boost removed");

    } catch (err) {
      console.error("REMOVEMONEYBOOST ERROR:", err);

      return i.reply({
        content: "❌ Error removing boost",
        ephemeral: true
      });
    }
  }
};