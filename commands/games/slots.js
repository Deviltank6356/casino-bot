const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");

const emojis = ["🍒", "🍋", "🔔", "💎", "7️⃣"];

function roll() {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Spin the animated slots")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Your bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = getUser(interaction.user.id);

    if (!user) {
      return interaction.reply({ content: "❌ User not found", ephemeral: true });
    }

    if (bet <= 0) {
      return interaction.reply({ content: "❌ Invalid bet", ephemeral: true });
    }

    if (user.money < bet) {
      return interaction.reply({ content: "❌ Not enough coins", ephemeral: true });
    }

    // initial message
    let msg = await interaction.reply({
      content: "🎰 Spinning slots...\n│ ❔ │ ❔ │ ❔ │"
    });

    let a, b, c;

    // =============================
    // 🎬 ANIMATION PHASE
    // =============================
    for (let i = 0; i < 5; i++) {
      a = roll();
      b = roll();
      c = roll();

      await interaction.editReply(
        `🎰 **SLOTS SPINNING**\n` +
        `━━━━━━━━━━━━━━\n` +
        `│ ${a} │ ${b} │ ${c} │\n` +
        `━━━━━━━━━━━━━━\n` +
        `🎲 Spinning...`
      );

      await sleep(600);
    }

    // =============================
    // FINAL RESULT
    // =============================
    let multiplier = 0;
    let msgText = "";

    if (a === b && b === c) {
      multiplier = 10;
      msgText = "🔥 JACKPOT!!!";
    } 
    else if (a === b || b === c || a === c) {
      multiplier = 3;
      msgText = "✨ Nice hit!";
    } 
    else {
      multiplier = -1;
      msgText = "💀 No match...";
    }

    const change = bet * multiplier;
    user.money += change;

    saveUser(user);

    await interaction.editReply(
      `🎰 **SLOTS RESULT**\n` +
      `━━━━━━━━━━━━━━\n` +
      `│ ${a} │ ${b} │ ${c} │\n` +
      `━━━━━━━━━━━━━━\n` +
      `💰 Bet: ${bet}\n` +
      `📊 Result: ${change >= 0 ? "+" : ""}${change}\n` +
      `━━━━━━━━━━━━━━\n` +
      `${msgText}`
    );
  }
};