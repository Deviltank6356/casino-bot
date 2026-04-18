const { SlashCommandBuilder } = require("discord.js");
const { claim } = require("../../systems/rewards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Daily reward"),

  async execute(i) {
    const r = claim(i.user.id, "daily");
    if (r.error) return i.reply(r.error);

    i.reply(`🎁 +${r.amount}`);
  }
};