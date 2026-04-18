const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");

function isRed(number) {
  const reds = [
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
  ];
  return reds.includes(number);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎡 Play advanced roulette")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Amount to bet")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("type")
        .setDescription("Bet type: number / red / black / even / odd / high / low")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("number")
        .setDescription("Pick a number (only for number bet)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const type = interaction.options.getString("type");
    const pick = interaction.options.getInteger("number");

    const user = getUser(interaction.user.id);

    if (!user) {
      return interaction.reply({ content: "❌ User not found", ephemeral: true });
    }

    if (bet <= 0) {
      return interaction.reply({ content: "❌ Invalid bet", ephemeral: true });
    }

    if (user.money < bet) {
      return interaction.reply({ content: "❌ Not enough money", ephemeral: true });
    }

    const result = Math.floor(Math.random() * 37);

    let win = false;
    let multiplier = 0;

    // =============================
    // NUMBER BET (highest risk)
    // =============================
    if (type === "number") {
      if (pick === null) {
        return interaction.reply({ content: "❌ You must pick a number", ephemeral: true });
      }

      win = result === pick;
      multiplier = 35;
    }

    // =============================
    // RED / BLACK
    // =============================
    else if (type === "red") {
      win = result !== 0 && isRed(result);
      multiplier = 2;
    }
    else if (type === "black") {
      win = result !== 0 && !isRed(result);
      multiplier = 2;
    }

    // =============================
    // EVEN / ODD
    // =============================
    else if (type === "even") {
      win = result !== 0 && result % 2 === 0;
      multiplier = 2;
    }
    else if (type === "odd") {
      win = result % 2 === 1;
      multiplier = 2;
    }

    // =============================
    // HIGH / LOW
    // =============================
    else if (type === "high") {
      win = result >= 19 && result <= 36;
      multiplier = 2;
    }
    else if (type === "low") {
      win = result >= 1 && result <= 18;
      multiplier = 2;
    }

    // =============================
    // RESULT HANDLING
    // =============================
    let change = 0;

    if (win) {
      change = bet * multiplier;
      user.money += change;
    } else {
      user.money -= bet;
      change = -bet;
    }

    saveUser(user);

    return interaction.reply(
      `🎡 **ROULETTE**\n` +
      `━━━━━━━━━━━━━━\n` +
      `🎯 Result: ${result}\n` +
      `📌 Bet: ${type}${type === "number" ? ` (${pick})` : ""}\n` +
      `💰 Change: ${change >= 0 ? "+" : ""}${change}\n` +
      `━━━━━━━━━━━━━━\n` +
      `${win ? "🟢 WIN" : "🔴 LOSE"}`
    );
  }
};