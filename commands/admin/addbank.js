const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addbank")
    .setDescription("Add money to a user's bank")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  async execute(i, client) {
    try {
      if (!isAdmin(i.user.id)) {
        return i.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      const target = i.options.getUser("user");
      const amount = i.options.getInteger("amount");

      if (!target) {
        return i.reply({
          content: "❌ User not found",
          ephemeral: true
        });
      }

      if (!Number.isInteger(amount) || amount <= 0) {
        return i.reply({
          content: "❌ Invalid amount",
          ephemeral: true
        });
      }

      const user = getUser(target.id);

      // safety fallback
      if (typeof user.bank !== "number") user.bank = 0;

      user.bank += amount;

      saveUser(user);

      // safe logging
      try {
        await logAdminAction(
          client,
          i,
          "ADD BANK",
          `+${amount} bank → ${target.tag} (${target.id})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return i.reply({
        content: `🏦 Added ${amount} to bank`,
        ephemeral: true
      });

    } catch (err) {
      console.error("ADDBANK ERROR:", err);

      if (!i.replied) {
        return i.reply({
          content: "❌ Error adding bank money",
          ephemeral: true
        });
      }
    }
  }
};