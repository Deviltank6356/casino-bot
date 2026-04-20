const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const { getUser, saveUser } = require("../../db");

// =============================
// COLORS
// =============================
function isRed(n) {
  return [
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
  ].includes(n);
}

// =============================
// SPIN
// =============================
function spin() {
  return Math.floor(Math.random() * 37);
}

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
    const user = getUser(interaction.user.id);
    const bet = interaction.options.getInteger("bet");

    // =============================
    // VALIDATION
    // =============================
    if (!Number.isInteger(bet) || bet <= 0) {
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
    // BUTTON MENU
    // =============================
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`r_red_${bet}`).setLabel("🔴 Red").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`r_black_${bet}`).setLabel("⚫ Black").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`r_even_${bet}`).setLabel("2️⃣ Even").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`r_odd_${bet}`).setLabel("1️⃣ Odd").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`r_high_${bet}`).setLabel("⬆ High (19-36)").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`r_low_${bet}`).setLabel("⬇ Low (1-18)").setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      content: `🎡 Roulette Table\n💰 Bet: ${bet}\n\nChoose your bet type:`,
      components: [row],
      ephemeral: true
    });
  }
};