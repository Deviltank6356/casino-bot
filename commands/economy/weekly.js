const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Claim your weekly reward"),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);

      // Optional safety check (only if you implemented started properly)
      if (user.started !== 1) {
        return interaction.reply({
          content: "❌ Run /start first",
          ephemeral: true
        });
      }

      const result = claim(interaction.user.id, "weekly");

      if (!result || result.error) {
        return interaction.reply({
          content: result?.error || "❌ Failed to claim reward",
          ephemeral: true
        });
      }

      return interaction.reply(`🎁 +${result.amount}`);

    } catch (err) {
      console.error("WEEKLY ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Command failed",
          ephemeral: true
        });
      }
    }
  }
};