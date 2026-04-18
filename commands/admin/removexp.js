const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removexp")
    .setDescription("Remove XP from a user")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("XP amount")
        .setRequired(true)
    ),

  async execute(i, client) {
    try {
      if (!isAdmin(i.user.id)) {
        return i.reply({ content: "❌ No permission", ephemeral: true });
      }

      const target = i.options.getUser("user");
      const amount = i.options.getInteger("amount");

      if (!target) {
        return i.reply({ content: "❌ User not found", ephemeral: true });
      }

      if (!amount || amount <= 0) {
        return i.reply({ content: "❌ Invalid amount", ephemeral: true });
      }

      const user = getUser(target.id);
      user.xp = Math.max(0, user.xp - amount);
      saveUser(user);

      // SAFE LOGGING (prevents crashes)
      try {
        await logAdminAction(
          client,
          i,
          "REMOVE XP",
          `-${amount} XP from ${target.tag} (${target.id})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return i.reply(`⭐ Removed ${amount} XP`);

    } catch (err) {
      console.error("REMOVEXP ERROR:", err);

      return i.reply({
        content: "❌ Error removing XP",
        ephemeral: true
      });
    }
  }
};