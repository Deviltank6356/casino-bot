const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexp")
    .setDescription("Remove XP from a user")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User to remove XP from")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("XP amount to remove")
        .setRequired(true)
    ),

  async execute(i) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "❌ No permission", ephemeral: true });

    const user = getUser(i.options.getUser("user").id);
    const amount = i.options.getInteger("amount");

    user.xp -= amount;

    if (user.xp < 0) user.xp = 0;

    saveUser(user);

    i.reply(`⭐ Removed ${amount} XP`);
  }
};