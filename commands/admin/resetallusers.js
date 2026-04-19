const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");
const { db } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetallusers")
    .setDescription("⚠️ OWNER ONLY: Reset ALL user data")
    .addStringOption(o =>
      o
        .setName("confirm")
        .setDescription('Type "YES" to confirm wipe')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      // =========================
      // OWNER CHECK
      // =========================
      if (interaction.user.id !== config.ownerId) {
        return interaction.reply({
          content: "❌ Only the bot owner can use this command.",
          ephemeral: true
        });
      }

      const confirm = interaction.options.getString("confirm");

      if (confirm !== "YES") {
        return interaction.reply({
          content: "⚠️ You must type YES to confirm.",
          ephemeral: true
        });
      }

      // =========================
      // RESET DATABASE
      // =========================
      db.prepare("DELETE FROM users").run();

      // =========================
      // LOG (safe)
      // =========================
      try {
        await logAdminAction(
          client,
          interaction,
          "RESET ALL USERS",
          `All user data wiped by owner (${interaction.user.tag})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return interaction.reply("💥 All user data has been reset by the owner.");

    } catch (err) {
      console.error("RESETALLUSERS ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Failed to reset users.",
          ephemeral: true
        });
      }
    }
  }
};