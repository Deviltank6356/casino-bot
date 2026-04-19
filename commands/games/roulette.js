const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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
    try {
      const bet = interaction.options.getInteger("bet");
      const type = interaction.options.getString("type");
      const pick = interaction.options.getInteger("number");

      const user = getUser(interaction.user.id);

      if (!user) {
        return interaction.reply({
          content: "❌ User not found",
          ephemeral: true
        });
      }

      if (bet <= 0) {
        return interaction.reply({
          content: "❌ Invalid bet",
          ephemeral: true
        });
      }

      if (user.money < bet) {
        return interaction.reply({
          content: "❌ Not enough money",
          ephemeral: true
        });
      }

      const result = Math.floor(Math.random() * 37);

      let win = false;
      let multiplier = 0;

      if (type === "number") {
        if (pick === null) {
          return interaction.reply({
            content: "❌ You must pick a number",
            ephemeral: true
          });
        }

        win = result === pick;
        multiplier = 35;
      }

      else if (type === "red") {
        win = result !== 0 && isRed(result);
        multiplier = 2;
      }

      else if (type === "black") {
        win = result !== 0 && !isRed(result);
        multiplier = 2;
      }

      else if (type === "even") {
        win = result !== 0 && result % 2 === 0;
        multiplier = 2;
      }

      else if (type === "odd") {
        win = result % 2 === 1;
        multiplier = 2;
      }

      else if (type === "high") {
        win = result >= 19 && result <= 36;
        multiplier = 2;
      }

      else if (type === "low") {
        win = result >= 1 && result <= 18;
        multiplier = 2;
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

      const embed = new EmbedBuilder()
        .setTitle("🎡 Roulette")
        .setColor(win ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "🎯 Result", value: `${result}`, inline: true },
          { name: "📌 Bet", value: `${type}${type === "number" ? ` (${pick})` : ""}`, inline: true },
          { name: "💰 Change", value: `${change >= 0 ? "+" : ""}${change}`, inline: true },
          { name: "📊 Outcome", value: win ? "🟢 WIN" : "🔴 LOSE", inline: false }
        )
        .setFooter({ text: "Good luck next spin!" });

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("ROULETTE ERROR:", err);

      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: "❌ Command failed",
          ephemeral: true
        });
      }
    }
  }
};