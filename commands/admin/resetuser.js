const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");
const { db } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetuser")
    .setDescription("Reset a user's economy data")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User to reset")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({
        content: "❌ Only owner can use this",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");

    const fresh = {
      money: Number(config.startingMoney ?? 0),
      xp: Number(config.startingXP ?? 0),
      level: Number(config.startingLevel ?? 0),
      bank: Number(config.startingBank ?? 0)
    };

    db.prepare(`
      UPDATE users SET
        money = ?,
        xp = ?,
        level = ?,
        bank = ?,
        claims = '{}',
        streaks = '{}',
        started = 0,
        spotifyLinked = 0,
        spotifyRefreshToken = NULL,
        lastChannelId = NULL
      WHERE id = ?
    `).run(
      fresh.money,
      fresh.xp,
      fresh.level,
      fresh.bank,
      target.id
    );

    return interaction.reply(`🧨 Fully reset ${target.username}`);
  }
};