const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const manager = require("../../games/blackjackManager");
const { getUser } = require("../../db");

const activeGames = new Map();

// =============================
// START CHECK
// =============================
function requireStart(user, interaction) {
  if (Number(user?.started) !== 1) {
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ You must run /start first!",
        flags: 64
      });
    }
    return false;
  }
  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Play blackjack vs dealer")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Amount to bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const user = getUser(interaction.user.id);

      if (!requireStart(user, interaction)) return;

      const bet = interaction.options.getInteger("bet");

      if (!Number.isFinite(bet) || bet <= 0) {
        return interaction.reply({
          content: "❌ Invalid bet",
          flags: 64
        });
      }

      if ((user.money ?? 0) < bet) {
        return interaction.reply({
          content: "❌ Not enough money",
          flags: 64
        });
      }

      if (activeGames.has(interaction.user.id)) {
        return interaction.reply({
          content: "❌ You already have an active blackjack game",
          flags: 64
        });
      }

      const game = manager.start(interaction.user.id, bet);

      if (!game) {
        return interaction.reply({
          content: "❌ Failed to start game",
          flags: 64
        });
      }

      activeGames.set(interaction.user.id, Date.now());

      const embed = new EmbedBuilder()
        .setTitle("🃏 Blackjack vs Dealer")
        .setColor(0x2b2d31)
        .addFields(
          {
            name: "🧑 You",
            value: Array.isArray(game.player) ? game.player.join(", ") : String(game.player),
            inline: true
          },
          {
            name: "🎩 Dealer",
            value: Array.isArray(game.dealer) ? game.dealer.join(", ") : String(game.dealer),
            inline: true
          },
          {
            name: "💰 Bet",
            value: `${bet}`,
            inline: false
          }
        );

      // 🔥 FIXED: use ":" (matches router system)
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`hit:${interaction.user.id}`)
          .setLabel("Hit")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`stand:${interaction.user.id}`)
          .setLabel("Stand")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });

    } catch (err) {
      console.error("BLACKJACK ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Command failed safely",
          flags: 64
        });
      }
    }
  },

  endGame(userId) {
    activeGames.delete(userId);
  },

  isActive(userId) {
    return activeGames.has(userId);
  }
};