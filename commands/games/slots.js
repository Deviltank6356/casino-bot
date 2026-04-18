const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");

// =============================
// RARITY SYSTEM
// Higher number = more common
// =============================
const symbols = [
  { emoji: "🍒", weight: 45, multiplier: 2 },
  { emoji: "🔔", weight: 30, multiplier: 1.5 },
  { emoji: "7️⃣", weight: 20, multiplier: 3 },
  { emoji: "💎", weight: 5, multiplier: 5 } // VERY RARE
];

// =============================
// WEIGHTED ROLL
// =============================
function roll() {
  const total = symbols.reduce((a, b) => a + b.weight, 0);
  let rand = Math.floor(Math.random() * total);

  for (const s of symbols) {
    if (rand < s.weight) return s;
    rand -= s.weight;
  }
}

// =============================
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Casino slots with rarities")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Your bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = getUser(interaction.user.id);

    if (bet <= 0) return interaction.reply("❌ Invalid bet");
    if (user.money < bet) return interaction.reply("❌ Not enough money");

    await interaction.reply("🎰 Spinning...");

    let a, b, c;

    // animation
    for (let i = 0; i < 6; i++) {
      a = roll().emoji;
      b = roll().emoji;
      c = roll().emoji;

      await interaction.editReply(
        `🎰 **SLOTS**\n` +
        `━━━━━━━━━━━━━━\n` +
        `│ ${a} │ ${b} │ ${c} │\n` +
        `━━━━━━━━━━━━━━`
      );

      await sleep(400);
    }

    // =============================
    // WIN CHECK (3 MATCH ONLY)
    // =============================
    let multiplier = 0;
    let win = false;

    if (a === b && b === c) {
      const symbol = symbols.find(s => s.emoji === a);
      win = true;
      multiplier = symbol.multiplier;
    }

    let change = 0;

    if (win) {
      change = bet * multiplier;
      user.money += change;
    } else {
      change = -bet;
      user.money -= bet;
    }

    saveUser(user);

    await interaction.editReply(
      `🎰 **RESULT**\n` +
      `━━━━━━━━━━━━━━\n` +
      `│ ${a} │ ${b} │ ${c} │\n` +
      `━━━━━━━━━━━━━━\n` +
      `💰 Bet: ${bet}\n` +
      `📊 ${win ? "+" : ""}${change}\n` +
      `━━━━━━━━━━━━━━\n` +
      `${win ? "🟢 WIN" : "🔴 LOSE"}`
    );
  }
};