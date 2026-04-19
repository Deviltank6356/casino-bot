const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addxp")
    .setDescription("Add XP to a user")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("XP amount")
        .setRequired(true)
    ),

  async execute(i, client) {
    try {
      if (!isAdmin(i.user.id)) {
        return i.reply({ content: "❌ No permission", ephemeral: true });
      }

      const target = i.options.getUser("user");
      const amount = i.options.getInteger("amount");

      if (!target) {
        return i.reply({ content: "❌ User not found", ephemeral: true });
      }

      if (!amount || amount <= 0) {
        return i.reply({
          content: "❌ Invalid amount",
          ephemeral: true
        });
      }

      const user = getUser(target.id);

      // ✅ ADD XP
      user.xp += amount;

      saveUser(user);

      // 🔒 SAFE LOGGING
      try {
        await logAdminAction(
          client,
          i,
          "ADD XP",
          `+${amount} XP → ${target.tag} (${target.id})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return i.reply(`⭐ Added ${amount} XP to ${target.username}`);

    } catch (err) {
      console.error("ADDXP ERROR:", err);

      return i.reply({
        content: "❌ Error adding XP",
        ephemeral: true
      });
    }
  }
};