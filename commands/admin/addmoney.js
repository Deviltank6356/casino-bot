const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("Add money to a user")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User to give money to")
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
      return i.reply({ content: "No perms", ephemeral: true });

    const u = getUser(i.options.getUser("user").id);
    const amount = i.options.getInteger("amount");

    u.money += amount;
    saveUser(u);

    i.reply("Done");
  }
};