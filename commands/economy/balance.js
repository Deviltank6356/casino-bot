const { SlashCommandBuilder } = require("discord.js");
const { getUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check balance"),

  async execute(i) {
    const u = getUser(i.user.id);

    i.reply(`💰 ${u.money}\n🏦 ${u.bank}\n⭐ XP ${u.xp}`);
  }
};