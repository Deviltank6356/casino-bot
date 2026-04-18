const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const money = require("../../systems/multipliers/moneyMultiplier");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addmoneyboost")
    .setDescription("Add a money multiplier boost")
    .addNumberOption(o =>
      o
        .setName("multiplier")
        .setDescription("Multiplier value (e.g. 2 for 2x)")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("minutes")
        .setDescription("Duration in minutes")
        .setRequired(true)
    ),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "No permission", ephemeral: true });

    const mult = i.options.getNumber("multiplier");
    const mins = i.options.getInteger("minutes");

    money.addMultiplier(mult, mins * 60000);

    i.reply(`💰 Added ${mult}x boost for ${mins} min`);
  }
};