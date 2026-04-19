const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward"),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);

      const result = claim(interaction.user.id, "daily");

      if (result?.error) {
        return interaction.reply({
          content: result.error,
          ephemeral: true
        });
      }

      return interaction.reply(`🎁 +${result.amount}`);

    } catch (err) {
      console.error("DAILY ERROR:", err);
      return interaction.reply({
        content: "❌ Command failed",
        ephemeral: true
      });
    }
  }
};