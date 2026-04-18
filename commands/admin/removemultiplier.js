const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const money = require("../../systems/multipliers/moneyMultiplier");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoneyboost")
    .setDescription("Remove a money multiplier boost")
    .addNumberOption(o =>
      o.setName("multiplier").setDescription("Multiplier").setRequired(true)
    ),

  async execute(i, client) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "No permission", ephemeral: true });

    const mult = i.options.getNumber("multiplier");

    money.removeMultiplier(mult);

    await logAdminAction(client, i, "REMOVE BOOST", `Removed ${mult}x money boost`);

    i.reply("💰 Boost removed");
  }
};