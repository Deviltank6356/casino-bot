const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("monthly")
    .setDescription("Claim your monthly reward"),

  async execute(i) {
    const result = claim(i.user.id, "monthly");

    if (result?.error) {
      return i.reply({ content: result.error, ephemeral: true });
    }

    return i.reply(`🎁 +${result.amount}`);
  }
};