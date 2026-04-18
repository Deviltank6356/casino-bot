const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addbank")
    .setDescription("Add money to a user's bank")
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount").setDescription("Amount").setRequired(true)
    ),

  async execute(i, client) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "❌ No permission", ephemeral: true });

    const target = i.options.getUser("user");
    const amount = i.options.getInteger("amount");

    const user = getUser(target.id);
    user.bank += amount;
    saveUser(user);

    await logAdminAction(client, i, "ADD BANK", `+${amount} to ${target.tag}`);

    i.reply(`🏦 Added ${amount} to bank`);
  }
};