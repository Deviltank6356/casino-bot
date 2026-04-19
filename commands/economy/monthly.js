const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("monthly")
    .setDescription("Claim your monthly reward"),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);

      const result = claim(interaction.user.id, "monthly");

      if (result?.error) {
        return interaction.reply({
          content: result.error,
          ephemeral: true
        });
      }

      return interaction.reply(`🎁 +${result.amount}`);

    } catch (err) {
      console.error("MONTHLY ERROR:", err);
      return interaction.reply({
        content: "❌ Command failed",
        ephemeral: true
      });
    }
  }
};