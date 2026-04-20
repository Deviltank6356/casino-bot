const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");
const { getUser, saveUser } = require("../../db");
const { logAdminAction } = require("../../services/adminLogger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetuser")
    .setDescription("Reset a user's economy data")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User to reset")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      if (interaction.user.id !== config.ownerId) {
        return interaction.reply({
          content: "❌ Only the bot owner can use this command.",
          ephemeral: true
        });
      }

      const target = interaction.options.getUser("user");
      if (!target) {
        return interaction.reply({
          content: "❌ User not found",
          ephemeral: true
        });
      }

      // 🔥 DO NOT mutate existing user — fully replace it
      const resetUser = {
        id: target.id,

        money: Number(config.startingMoney ?? 0),
        xp: Number(config.startingXP ?? 0),
        level: Number(config.startingLevel ?? 0),
        bank: Number(config.startingBank ?? 0),

        claims: {},
        streaks: {
          daily: { count: 0, last: 0 },
          weekly: { count: 0, last: 0 },
          monthly: { count: 0, last: 0 }
        },

        started: 0,

        spotifyLinked: 0,
        spotifyRefreshToken: null,
        lastChannelId: null,

        joinedAt: Date.now()
      };

      saveUser(resetUser);

      try {
        await logAdminAction(
          client,
          interaction,
          "RESET USER",
          `Reset ${target.tag} (${target.id})`
        );
      } catch (err) {
        console.error("LOG ERROR:", err);
      }

      return interaction.reply(`🧨 Reset **${target.username}**'s data`);

    } catch (err) {
      console.error("RESETUSER ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Error resetting user",
          ephemeral: true
        });
      }
    }
  }
};