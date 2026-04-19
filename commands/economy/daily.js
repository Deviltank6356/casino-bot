const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward"),

  async execute(i) {
    try {
      const user = getUser(i.user.id);

      if (!user?.started) {
        return i.reply({ content: "❌ Run /start first", ephemeral: true });
      }

      const result = claim(i.user.id, "daily");

      if (result?.error) {
        return i.reply({ content: result.error, ephemeral: true });
      }

      return i.reply(`🎁 +${result.amount}`);

    } catch (err) {
      console.error("DAILY ERROR:", err);
      return i.reply({ content: "❌ Command failed", ephemeral: true });
    }
  }
};