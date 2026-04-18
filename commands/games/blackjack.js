const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const manager = require("../../games/blackjackManager");
const { getUser } = require("../../db");

function format(game) {
  return (
    `🃏 **BLACKJACK**\n` +
    `━━━━━━━━━━━━━━\n` +
    `🧑 You: **${game.player}**\n` +
    `🎩 Dealer: **${game.dealer}**\n` +
    `💰 Bet: **${game.bet}**\n` +
    `━━━━━━━━━━━━━━`
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Play interactive blackjack")
    .addIntegerOption(o =>
      o
        .setName("bet")
        .setDescription("Amount to bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = getUser(interaction.user.id);

    if (user.money < bet) {
      return interaction.reply({
        content: "❌ Not enough money.",
        ephemeral: true
      });
    }

    const game = manager.createGame(interaction.user.id, bet);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: format(game),
      components: [row]
    });
  }
};