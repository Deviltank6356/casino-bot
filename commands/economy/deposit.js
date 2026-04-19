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

  async execute(i) {
    try {
      const amount = i.options.getInteger("amount");
      const user = getUser(i.user.id);

      if (!user?.started) {
        return i.reply({ content: "❌ Run /start first", ephemeral: true });
      }

      if (!amount || amount <= 0) {
        return i.reply({ content: "❌ Invalid amount", ephemeral: true });
      }

      const result = deposit(i.user.id, amount);

      if (result?.error) {
        return i.reply({ content: result.error, ephemeral: true });
      }

      return i.reply("🏦 Deposited successfully");

    } catch (err) {
      console.error("DEPOSIT ERROR:", err);
      return i.reply({ content: "❌ Command failed", ephemeral: true });
    }
  }
};