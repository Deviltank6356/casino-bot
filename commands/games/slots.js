const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");
const { requireStart } = require("../../utils/requireStart");

// =============================
// SYMBOL SYSTEM
// =============================
const symbols = [
  { emoji: "🍒", weight: 45, multiplier: 2 },
  { emoji: "🔔", weight: 30, multiplier: 1.5 },
  { emoji: "7️⃣", weight: 20, multiplier: 3 },
  { emoji: "💎", weight: 5, multiplier: 5 }
];

// =============================
function roll() {
  const total = symbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.floor(Math.random() * total);

  for (const s of symbols) {
    if (rand < s.weight) return s;
    rand -= s.weight;
  }

  return symbols[0];
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// =============================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Casino slots")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Your bet amount")
        .setRequired(true)
    ),

  async execute(interaction) {

    // =============================
    // /START CHECK (SAFE)
    // =============================
    const startCheck = requireStart(interaction);
    if (!startCheck) {
      return interaction.reply({
        content: "❌ You must run /start first",
        ephemeral: true
      });
    }

    try {
      const bet = interaction.options.getInteger("bet");
      const user = getUser(interaction.user.id);

      if (!user) {
        return interaction.reply({
          content: "❌ User not found",
          ephemeral: true
        });
      }

      if (bet <= 0) {
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

      await interaction.reply("🎰 Spinning the slots...");

      let a, b, c;

      // =============================
      // ANIMATION
      // =============================
      for (let i = 0; i < 5; i++) {
        a = roll().emoji;
        b = roll().emoji;
        c = roll().emoji;

        await interaction.editReply(
          `🎰 **SLOTS**\n` +
          `━━━━━━━━━━━━━━\n` +
          `│ ${a} │ ${b} │ ${c} │\n` +
          `━━━━━━━━━━━━━━`
        );

        await sleep(300);
      }

      // =============================
      // WIN CHECK
      // =============================
      let win = false;
      let multiplier = 0;

      if (a === b && b === c) {
        const symbol = symbols.find(s => s.emoji === a);
        win = true;
        multiplier = symbol?.multiplier || 1;
      }

      const change = win ? bet * multiplier : -bet;

      user.money = (user.money ?? 0) + change;

      try {
        saveUser(user);
      } catch (err) {
        console.error("DB SAVE ERROR:", err);
      }

      // =============================
      // RESULT EMBED
      // =============================
      const embed = new EmbedBuilder()
        .setTitle("🎰 Slots")
        .setColor(win ? 0x00ff00 : 0xff0000)
        .addFields(
          {
            name: "🎲 Result",
            value: `│ ${a} │ ${b} │ ${c} │`,
            inline: false
          },
          {
            name: "💰 Bet",
            value: `${bet}`,
            inline: true
          },
          {
            name: "📊 Change",
            value: `${change >= 0 ? "+" : ""}${change}`,
            inline: true
          },
          {
            name: "🎯 Outcome",
            value: win ? "🟢 WIN" : "🔴 LOSE",
            inline: false
          }
        )
        .setTimestamp();

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (err) {
      console.error("SLOTS ERROR:", err);

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: "❌ Slots crashed safely",
          ephemeral: true
        });
      }

      return interaction.reply({
        content: "❌ Slots crashed safely",
        ephemeral: true
      });
    }
  }
};