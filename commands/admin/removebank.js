const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removebank")
    .setDescription("Remove money from a user's bank")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User to remove bank money from")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount to remove")
        .setRequired(true)
    ),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "❌ No permission", ephemeral: true });

    const user = getUser(i.options.getUser("user").id);
    const amount = i.options.getInteger("amount");

    user.bank -= amount;

    saveUser(user);

    i.reply(`🏦 Removed ${amount} from bank`);
  }
};