const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const money = require("../../systems/multipliers/moneyMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addmoneyboost")
    .setDescription("Add money multiplier boost")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("Multiplier value (e.g. 2 = 2x)")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("minutes")
        .setDescription("Duration in minutes")
        .setRequired(true)
    ),

  async execute(i, client) {
    try {
      if (!isAdmin(i.user.id)) {
        return i.reply({ content: "No permission", ephemeral: true });
      }

      const mult = i.options.getNumber("multiplier");
      const mins = i.options.getInteger("minutes");

      money.addMultiplier(mult, mins * 60000);

      // safe logging (won’t crash command if logging fails)
      await logAdminAction(client, i, "ADD MONEY BOOST", `${mult}x for ${mins}m`)
        .catch(err => console.error("LOG ERROR:", err));

      return i.reply(`💰 Added ${mult}x boost for ${mins} min`);

    } catch (err) {
      console.error("ADD MONEY BOOST ERROR:", err);

      return i.reply({
        content: "❌ Error executing command",
        ephemeral: true
      });
    }
  }
};