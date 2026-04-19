const { SlashCommandBuilder } = require("discord.js");
const { withdraw } = require("../../systems/bank");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw money from your bank")
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Amount of money to withdraw")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const amount = interaction.options.getInteger("amount");
      const user = getUser(interaction.user.id);

      // START CHECK (only works if you fixed DB started flag)
      if (user.started !== 1) {
        return interaction.reply({
          content: "❌ Run /start first",
          ephemeral: true
        });
      }

      // VALIDATION
      if (!Number.isFinite(amount) || amount <= 0) {
        return interaction.reply({
          content: "❌ Invalid amount",
          ephemeral: true
        });
      }

      const result = withdraw(interaction.user.id, amount);

      if (!result || result.error) {
        return interaction.reply({
          content: result?.error || "❌ Withdraw failed",
          ephemeral: true
        });
      }

      return interaction.reply(`💰 Withdrawn successfully: ${result.amount ?? amount}`);

    } catch (err) {
      console.error("WITHDRAW ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Command failed",
          ephemeral: true
        });
      }
    }
  }
};