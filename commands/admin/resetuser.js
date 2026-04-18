const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../../config.json");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetuser")
    .setDescription("Reset a user's economy data")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User to reset")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      // Permission check
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      const target = interaction.options.getUser("user");
      if (!target) {
        return interaction.reply({
          content: "❌ User not found",
          ephemeral: true
        });
      }

      const user = getUser(target.id);

      // Reset values safely
      user.money = Number(config.startingMoney ?? 0);
      user.xp = Number(config.startingXP ?? 0);
      user.level = Number(config.startingLevel ?? 0);
      user.bank = Number(config.startingBank ?? 0);

      saveUser(user);

      // Safe logging (won’t break command if logger fails)
      await logAdminAction(
        client,
        interaction,
        "RESET USER",
        `Reset ${target.tag} (${target.id})`
      ).catch(err => console.error("LOG ERROR:", err));

      return interaction.reply(`🧨 Reset **${target.username}**'s data`);

    } catch (err) {
      console.error("RESETUSER ERROR:", err);

      // fallback response (prevents "application did not respond")
      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Error resetting user",
          ephemeral: true
        });
      }
    }
  }
};