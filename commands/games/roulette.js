const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { getUser } = require("../../db");

// =============================
// COMMAND
// =============================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎡 Play interactive roulette")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Amount to bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);
      const bet = interaction.options.getInteger("bet");

      // =============================
      // VALIDATION
      // =============================
      if (!Number.isFinite(bet) || bet <= 0) {
        return interaction.reply({
          content: "❌ Invalid bet amount",
          ephemeral: true
        });
      }

      if ((user.money ?? 0) < bet) {
        return interaction.reply({
          content: "❌ Not enough money",
          ephemeral: true
        });
      }

      // =============================
      // BUTTONS (SAFE FORMAT: r:type:bet)
      // =============================
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`r:red:${bet}`)
          .setLabel("🔴 Red")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`r:black:${bet}`)
          .setLabel("⚫ Black")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`r:even:${bet}`)
          .setLabel("2️⃣ Even")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`r:odd:${bet}`)
          .setLabel("1️⃣ Odd")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`r:high:${bet}`)
          .setLabel("⬆ High (19–36)")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`r:low:${bet}`)
          .setLabel("⬇ Low (1–18)")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: `🎡 **Roulette Table**\n💰 Bet: **${bet}**\n\nChoose your option below:`,
        components: [row],
        ephemeral: true
      });

    } catch (err) {
      console.error("ROULETTE COMMAND ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Roulette failed to start",
          ephemeral: true
        });
      }
    }
  }
};