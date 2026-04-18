const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../../config.json");
const { getUser, saveUser } = require("../../db");

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

  async execute(interaction) {
    // Better permission system (more reliable than member.permissions in some setups)
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ No permission",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");
    const user = getUser(target.id);

    // Reset values
    user.money = config.startingMoney ?? 0;
    user.xp = config.startingXP ?? 0;
    user.level = config.startingLevel ?? 0;
    user.bank = config.startingBank ?? 0;

    saveUser(user);

    return interaction.reply(`🧨 Reset **${target.username}**'s data`);
  }
};