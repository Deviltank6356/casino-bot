const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Claim your weekly reward"),

  async execute(i) {
    const result = claim(i.user.id, "weekly");

    if (result?.error) {
      return i.reply({ content: result.error, ephemeral: true });
    }

    return i.reply(`🎁 +${result.amount}`);
  }
};