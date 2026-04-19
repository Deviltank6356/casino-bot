const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");

function isRed(number) {
  return [
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
  ].includes(number);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("🎡 Play roulette")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Amount to bet")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("type")
        .setDescription("number / red / black / even / odd / high / low")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("number")
        .setDescription("Only for number bet")
    ),

  async execute(interaction) {
    try {
      const bet = interaction.options.getInteger("bet");
      const type = interaction.options.getString("type");
      const pick = interaction.options.getInteger("number");

      const user = getUser(interaction.user.id);

      if (!user) {
        return interaction.reply({ content: "❌ User not found", ephemeral: true });
      }

      if (!bet || isNaN(bet) || bet <= 0) {
        return interaction.reply({ content: "❌ Invalid bet", ephemeral: true });
      }

      if ((user.money || 0) < bet) {
        return interaction.reply({ content: "❌ Not enough money", ephemeral: true });
      }

      const result = Math.floor(Math.random() * 37);

      let win = false;
      let multiplier = 0;

      // =========================
      // NUMBER BET
      // =========================
      if (type === "number") {
        if (pick == null || isNaN(pick)) {
          return interaction.reply({
            content: "❌ You must pick a number (0–36)",
            ephemeral: true
          });
        }

        win = result === pick;
        multiplier = 35;
      }

      // =========================
      // COLOR BETS
      // =========================
      else if (type === "red") {
        win = result !== 0 && isRed(result);
        multiplier = 2;
      }
      else if (type === "black") {
        win = result !== 0 && !isRed(result);
        multiplier = 2;
      }

      // =========================
      // EVEN / ODD
      // =========================
      else if (type === "even") {
        win = result !== 0 && result % 2 === 0;
        multiplier = 2;
      }
      else if (type === "odd") {
        win = result % 2 === 1;
        multiplier = 2;
      }

      // =========================
      // HIGH / LOW
      // =========================
      else if (type === "high") {
        win = result >= 19 && result <= 36;
        multiplier = 2;
      }
      else if (type === "low") {
        win = result >= 1 && result <= 18;
        multiplier = 2;
      }

      else {
        return interaction.reply({
          content: "❌ Invalid bet type",
          ephemeral: true
        });
      }

      const change = win ? bet * multiplier : -bet;

      user.money = (user.money || 0) + change;

      saveUser(user);

      const embed = new EmbedBuilder()
        .setTitle("🎡 Roulette")
        .setColor(win ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "🎯 Result", value: `${result}`, inline: true },
          { name: "📌 Bet", value: `${type}${type === "number" ? ` (${pick})` : ""}`, inline: true },
          { name: "💰 Change", value: `${change >= 0 ? "+" : ""}${change}`, inline: true },
          { name: "🏁 Outcome", value: win ? "🟢 WIN" : "🔴 LOSE", inline: false }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("ROULETTE ERROR:", err);

      return interaction.reply({
        content: "❌ Command failed safely",
        ephemeral: true
      });
    }
  }
};