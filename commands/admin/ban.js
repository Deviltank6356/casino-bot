const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");
const { logAction } = require("../../db");
const { isProtected } = require("../../utils/permissions");

function banUser(id) {
  const user = getUser(id);

  if (!user) return false;

  user.banned = 1;

  saveUser(user);
  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the bot")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User to ban")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason")
        .setDescription("Reason for ban")
    ),

  async execute(interaction) {
    try {
      const target = interaction.options.getUser("user");
      const executor = interaction.user;
      const reason = interaction.options.getString("reason") || "No reason provided";

      // =============================
      // 🔒 PROTECTION CHECK (OWNER/ADMIN SAFE)
      // =============================
      if (isProtected(target.id, executor.id)) {
        logAction({
          type: "BAN_BLOCKED",
          actorId: executor.id,
          targetId: target.id,
          reason,
          success: 0
        });

        return interaction.reply({
          content: "🚫 You cannot ban this user (protected role).",
          ephemeral: true
        });
      }

      // =============================
      // 🧠 SAFE BAN EXECUTION
      // =============================
      const success = banUser(target.id);

      if (!success) {
        return interaction.reply({
          content: "❌ Failed to ban user (internal error)",
          ephemeral: true
        });
      }

      // =============================
      // 📊 AUDIT LOG (EXPLOIT TRACKING)
      // =============================
      logAction({
        type: "BAN",
        actorId: executor.id,
        targetId: target.id,
        reason,
        success: 1
      });

      return interaction.reply({
        content: `🚫 Banned <@${target.id}>`
      });

    } catch (err) {
      console.error("BAN ERROR:", err);

      try {
        if (!interaction.replied) {
          return interaction.reply({
            content: "❌ Ban command failed safely",
            ephemeral: true
          });
        }
      } catch {}
    }
  }
};