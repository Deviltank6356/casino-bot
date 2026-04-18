const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexp")
    .setDescription("Remove XP from a user")
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount").setDescription("XP amount").setRequired(true)
    ),

  async execute(i, client) {
    if (!isAdmin(i.user.id))
      return i.reply({ content: "❌ No permission", ephemeral: true });

    const target = i.options.getUser("user");
    const amount = i.options.getInteger("amount");

    const user = getUser(target.id);
    user.xp = Math.max(0, user.xp - amount);
    saveUser(user);

    await logAdminAction(client, i, "REMOVE XP", `-${amount} XP from ${target.tag}`);

    i.reply(`⭐ Removed ${amount} XP`);
  }
};