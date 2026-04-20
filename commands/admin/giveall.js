const { SlashCommandBuilder } = require("discord.js");
const { db, getUser, saveUser } = require("../../db");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveall")
    .setDescription("💰 Give money to ALL users (admin only)")
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Amount to give to every user")
        .setRequired(true)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    // =============================
    // SECURITY CHECK
    // =============================
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({
        content: "❌ Owner only command",
        ephemeral: true
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return interaction.reply({
        content: "❌ Invalid amount",
        ephemeral: true
      });
    }

    // =============================
    // FETCH ALL USERS
    // =============================
    const users = db.prepare("SELECT id FROM users").all();

    if (!users.length) {
      return interaction.reply({
        content: "❌ No users found",
        ephemeral: true
      });
    }

    await interaction.reply(`💰 Giving **${amount}** to **${users.length} users**...`);

    let updated = 0;

    // =============================
    // SAFE LOOP UPDATE
    // =============================
    for (const row of users) {
      try {
        const user = getUser(row.id);

        user.money = Number(user.money || 0) + amount;

        saveUser(user);

        updated++;

      } catch (err) {
        console.error(`Failed updating user ${row.id}:`, err);
      }
    }

    return interaction.editReply(
      `✅ Done!\n💰 Added **${amount}** to **${updated} users**`
    );
  }
};