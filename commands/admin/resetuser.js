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
        .setDescription("User to reset") // ✅ FIXED (important)
        .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "❌ No permission", ephemeral: true });
      }

      const target = interaction.options.getUser("user");
      const user = getUser(target.id);

      user.money = config.startingMoney ?? 0;
      user.xp = config.startingXP ?? 0;
      user.level = config.startingLevel ?? 0;
      user.bank = config.startingBank ?? 0;

      saveUser(user);

      await logAdminAction(
        client,
        interaction,
        "RESET USER",
        `Reset ${target.tag} (${target.id})`
      );

      return interaction.reply(`🧨 Reset **${target.username}**'s data`);
    } catch (err) {
      console.error("RESETUSER ERROR:", err);
      return interaction.reply({
        content: "❌ Error resetting user",
        ephemeral: true
      });
    }
  }
};