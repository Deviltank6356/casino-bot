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

function roll() {
  const total = symbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.floor(Math.random() * total);

  for (const s of symbols) {
    if (rand < s.weight) return s;
    rand -= s.weight;
  }

  return symbols[0];
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// =============================
// COMMAND
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
    try {
      const user = getUser(interaction.user.id);

      // ✅ FIXED START CHECK
      if (!requireStart(user, interaction)) return;

      const bet = interaction.options.getInteger("bet");

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

      let a = "❔", b = "❔", c = "❔";

      // initial embed
      const embed = new EmbedBuilder()
        .setTitle("🎰 Slots Machine")
        .setColor(0x2b2d31)
        .setDescription(`Spinning...\n\n│ ${a} │ ${b} │ ${c} │`)
        .addFields(
          { name: "💰 Bet", value: `${bet}`, inline: true }
        );

      await interaction.reply({ embeds: [embed] });

      // =============================
      // ANIMATION (EDIT EMBED ONLY)
      // =============================
      for (let i = 0; i < 5; i++) {
        a = roll().emoji;
        b = roll().emoji;
        c = roll().emoji;

        embed.setDescription(`🎰 Spinning...\n\n│ ${a} │ ${b} │ ${c} │`);

        await interaction.editReply({ embeds: [embed] });
        await sleep(400);
      }

      // =============================
      // RESULT
      // =============================
      let win = false;
      let multiplier = 0;

      if (a === b && b === c) {
        const symbol = symbols.find(s => s.emoji === a);
        win = true;
        multiplier = symbol?.multiplier ?? 1;
      }

      const change = win ? bet * multiplier : -bet;

      user.money = Number(user.money ?? 0) + change;
      saveUser(user);

      // FINAL EMBED
      const finalEmbed = new EmbedBuilder()
        .setTitle("🎰 Slots Result")
        .setColor(win ? 0x00ff00 : 0xff0000)
        .setDescription(`│ ${a} │ ${b} │ ${c} │`)
        .addFields(
          { name: "💰 Bet", value: `${bet}`, inline: true },
          { name: "📊 Change", value: `${change >= 0 ? "+" : ""}${change}`, inline: true },
          { name: "🎯 Outcome", value: win ? "🟢 WIN" : "🔴 LOSE", inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [finalEmbed] });

    } catch (err) {
      console.error("SLOTS ERROR:", err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Slots crashed safely",
          ephemeral: true
        });
      }
    }
  }
};