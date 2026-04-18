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
    console.log("🃏 BLACKJACK COMMAND TRIGGERED");

    const bet = interaction.options.getInteger("bet");
    console.log("💰 BET:", bet);

    const user = getUser(interaction.user.id);
    console.log("👤 USER:", user);

    if (!user) {
      console.log("❌ USER NOT FOUND");
      return interaction.reply("User data missing.");
    }

    if (user.money < bet) {
      console.log("❌ NOT ENOUGH MONEY");
      return interaction.reply({
        content: "❌ Not enough money.",
        ephemeral: true
      });
    }

    const game = manager.createGame(interaction.user.id, bet);
    console.log("🎮 GAME CREATED:", game);

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