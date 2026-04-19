const { SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../../utils/isAdmin");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removebank")
    .setDescription("Remove money from a user's bank")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount")
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

      // ✅ SAFE REMOVE (no negative bank)
      user.bank = Math.max(0, user.bank - amount);

      saveUser(user);

      // 🔒 SAFE LOGGING
      try {
        await logAdminAction(
          client,
          i,
          "REMOVE BANK",
          `-${amount} bank → ${target.tag} (${target.id})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return i.reply(`🏦 Removed ${amount} from ${target.username}'s bank`);

    } catch (err) {
      console.error("REMOVEBANK ERROR:", err);

      return i.reply({
        content: "❌ Error removing bank money",
        ephemeral: true
      });
    }
  }
};