const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { getUser } = require("../../db");

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
          flags: 64
        });
      }

      if ((user.money ?? 0) < bet) {
        return interaction.reply({
          content: "❌ Not enough money",
          flags: 64
        });
      }

      const uid = interaction.user.id;

      // =============================
      // BUTTONS (ANTI-EXPLOIT FORMAT)
      // r:type:bet:userId
      // =============================
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`r:red:${bet}:${uid}`)
          .setLabel("🔴 Red")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`r:black:${bet}:${uid}`)
          .setLabel("⚫ Black")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`r:even:${bet}:${uid}`)
          .setLabel("2️⃣ Even")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`r:odd:${bet}:${uid}`)
          .setLabel("1️⃣ Odd")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`r:high:${bet}:${uid}`)
          .setLabel("⬆ High (19–36)")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`r:low:${bet}:${uid}`)
          .setLabel("⬇ Low (1–18)")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: `🎡 **Roulette Table**\n💰 Bet: **${bet}**\n\nChoose your option below:`,
        components: [row],
        flags: 64
      });

    } catch (err) {
      console.error("ROULETTE COMMAND ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Roulette failed to start",
          flags: 64
        });
      }
    }
  }
};