const { SlashCommandBuilder } = require("discord.js");
const { deposit } = require("../../systems/bank");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit money into your bank")
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Amount of money to deposit")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const amount = interaction.options.getInteger("amount");
      const user = getUser(interaction.user.id);

      if (!amount || amount <= 0) {
        return interaction.reply({
          content: "❌ Invalid amount",
          ephemeral: true
        });
      }

      const result = deposit(interaction.user.id, amount);

      if (result?.error) {
        return interaction.reply({
          content: result.error,
          ephemeral: true
        });
      }

      return interaction.reply("🏦 Deposited successfully");

    } catch (err) {
      console.error("DEPOSIT ERROR:", err);
      return interaction.reply({
        content: "❌ Command failed",
        ephemeral: true
      });
    }
  }
};