const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addbank")
    .setDescription("Add money to a user's bank")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User to add bank money to")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount to add")
        .setRequired(true)
    ),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "❌ No permission", ephemeral: true });

    const user = getUser(i.options.getUser("user").id);
    const amount = i.options.getInteger("amount");

    user.bank += amount;

    saveUser(user);

    i.reply(`🏦 Added ${amount} to bank`);
  }
};