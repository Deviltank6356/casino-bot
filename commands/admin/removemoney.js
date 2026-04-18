const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoney")
    .addUserOption(o => o.setName("user").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setRequired(true))
    .setDescription("Remove money"),

  async execute(i) {
    if (!isAdmin(i.user.id)) return i.reply("No perms");

    const u = getUser(i.options.getUser("user").id);
    u.money -= i.options.getInteger("amount");
    saveUser(u);

    i.reply("Done");
  }
};