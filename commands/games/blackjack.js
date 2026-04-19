const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const manager = require("../../games/blackjackManager");
const { getUser } = require("../../db");

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
      const bet = interaction.options.getInteger("bet");
      const user = getUser(interaction.user.id);

      if (!user) {
        return interaction.reply({ content: "❌ User not found", ephemeral: true });
      }

      if (!bet || bet <= 0 || isNaN(bet)) {
        return interaction.reply({ content: "❌ Invalid bet", ephemeral: true });
      }

      if (!user.money || user.money < bet) {
        return interaction.reply({ content: "❌ Not enough money", ephemeral: true });
      }

      const game = manager.start(interaction.user.id, bet);

      if (!game) {
        return interaction.reply({ content: "❌ Game failed to start", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle("🃏 Blackjack vs Dealer")
        .setColor(0x2b2d31)
        .addFields(
          {
            name: "🧑 You",
            value: Array.isArray(game.player) ? game.player.join(", ") : String(game.player || "N/A"),
            inline: true
          },
          {
            name: "🎩 Dealer",
            value: Array.isArray(game.dealer) ? game.dealer.join(", ") : String(game.dealer || "N/A"),
            inline: true
          },
          {
            name: "💰 Bet",
            value: `${bet}`,
            inline: false
          }
        );

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

      return interaction.reply({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error("BLACKJACK ERROR:", err);

      return interaction.reply({
        content: "❌ Command failed safely",
        ephemeral: true
      });
    }
  }
};