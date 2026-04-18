const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addbank")
    .setDescription("Add money to bank")
    .addUserOption(o => o.setName("user").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setRequired(true)),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "❌ No permission", ephemeral: true });

    const user = getUser(i.options.getUser("user").id);
    user.bank += i.options.getInteger("amount");

    saveUser(user);

    i.reply(`🏦 Added ${i.options.getInteger("amount")} to bank`);
  }
};