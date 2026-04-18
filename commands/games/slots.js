const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");

const emojis = ["🍒", "🍋", "🔔", "💎", "7️⃣"];

function roll() {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Spin the slots")
    .addIntegerOption(o =>
      o.setName("bet").setDescription("Your bet").setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = getUser(interaction.user.id);

    if (bet <= 0) return interaction.reply("❌ Invalid bet.");
    if (user.money < bet) return interaction.reply("❌ Not enough coins.");

    const a = roll();
    const b = roll();
    const c = roll();

    let multiplier = 0;
    let msg = "";

    // OWO-style rewards
    if (a === b && b === c) {
      multiplier = 10;
      msg = "🔥 JACKPOT!!!";
    } 
    else if (a === b || b === c || a === c) {
      multiplier = 3;
      msg = "✨ Nice hit!";
    } 
    else {
      multiplier = -1;
      msg = "💀 No match...";
    }

    const change = bet * multiplier;
    user.money += change;

    saveUser(user);

    return interaction.reply(
      `🎰 **SLOTS**\n` +
      `━━━━━━━━━━━━━━\n` +
      `│ ${a} │ ${b} │ ${c} │\n` +
      `━━━━━━━━━━━━━━\n` +
      `💰 Bet: ${bet}\n` +
      `📊 Result: ${change >= 0 ? "+" : ""}${change}\n` +
      `━━━━━━━━━━━━━━\n` +
      `${msg}`
    );
  }
};