const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json");

const DB_PATH = path.join(__dirname, "../../users.json");

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

  async execute(interaction) {
    // OWNER ONLY CHECK
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({
        content: "❌ Only the bot owner can use this command.",
        ephemeral: true
      });
    }

    const confirm = interaction.options.getString("confirm");

    if (confirm !== "YES") {
      return interaction.reply({
        content: "⚠️ You must type **YES** to confirm reset.",
        ephemeral: true
      });
    }

    // Wipe database
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));

    return interaction.reply("💥 ALL USER DATA HAS BEEN RESET BY OWNER.");
  }
};