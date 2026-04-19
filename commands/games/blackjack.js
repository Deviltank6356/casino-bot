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
      o
        .setName("bet")
        .setDescription("Amount to bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const bet = interaction.options.getInteger("bet");
      const user = getUser(interaction.user.id);

      if (!user) {
        return interaction.reply({
          content: "❌ User not found",
          ephemeral: true
        });
      }

      if (user.money < bet) {
        return interaction.reply({
          content: "❌ Not enough money",
          ephemeral: true
        });
      }

      const game = manager.start(interaction.user.id, bet);

      const embed = new EmbedBuilder()
        .setTitle("🃏 Blackjack vs Dealer")
        .setColor(0x2b2d31)
        .addFields(
          {
            name: "🧑 You",
            value: String(game.player),
            inline: true
          },
          {
            name: "🎩 Dealer",
            value: String(game.dealer),
            inline: true
          },
          {
            name: "💰 Bet",
            value: `${game.bet}`,
            inline: false
          }
        )
        .setFooter({ text: "Hit or Stand wisely..." })
        .setTimestamp();

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
        embeds: [embed],
        components: [row]
      });

    } catch (err) {
      console.error("BLACKJACK ERROR:", err);

      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: "❌ Command failed",
          ephemeral: true
        });
      }
    }
  }
};