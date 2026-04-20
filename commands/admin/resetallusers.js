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
      // SAFE RESET (NO DELETE)
      // =========================
      db.prepare(`
        UPDATE users SET
          money = 0,
          xp = 0,
          level = 0,
          bank = 0,
          claims = '{}',
          streaks = '{}',
          started = 0,
          spotifyLinked = 0,
          spotifyRefreshToken = NULL,
          lastChannelId = NULL
      `).run();

      // =========================
      // LOG (SAFE)
      // =========================
      try {
        await logAdminAction(
          client,
          interaction,
          "RESET ALL USERS",
          `All user data reset by owner (${interaction.user.tag})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return interaction.reply({
        content: "💥 All user data has been safely reset.",
        ephemeral: true
      });

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