const { SlashCommandBuilder } = require("discord.js");
const { unbanUser } = require("../../db");
const { canBan } = require("../../utils/permissions");
const { auditLog } = require("../../utils/auditLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User to unban")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const target = interaction.options.getUser("user");
      const executor = interaction.user;

      // =============================
      // 🔒 ROLE PROTECTION CHECK
      // =============================
      if (!canBan(target.id, executor.id)) {
        auditLog("UNBAN_DENIED", {
          userId: executor.id,
          action: "UNBAN_BLOCKED",
          details: `target=${target.id}`
        });

        return interaction.reply({
          content: "❌ You cannot unban this user (protected role).",
          ephemeral: true
        });
      }

      // =============================
      // 🧠 SAFE DB CALL
      // =============================
      if (!unbanUser || typeof unbanUser !== "function") {
        return interaction.reply({
          content: "❌ Unban system not configured correctly.",
          ephemeral: true
        });
      }

      const result = unbanUser(target.id);

      // =============================
      // 📊 AUDIT LOG
      // =============================
      auditLog("UNBAN", {
        userId: target.id,
        action: "UNBANNED",
        details: `by=${executor.id}`
      });

      return interaction.reply({
        content: `✅ Unbanned **${target.tag}**`
      });

    } catch (err) {
      console.error("UNBAN ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Failed to unban user",
          ephemeral: true
        });
      }
    }
  }
};