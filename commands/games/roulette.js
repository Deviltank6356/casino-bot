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
      o.setName("bet").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("type").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("number")
    ),

  async execute(interaction) {
    try {
      const bet = interaction.options.getInteger("bet");
      const type = interaction.options.getString("type");
      const pick = interaction.options.getInteger("number");

      const user = getUser(interaction.user.id);

      if (!user) return interaction.reply({ content: "❌ User not found", ephemeral: true });

      if (!bet || bet <= 0 || isNaN(bet))
        return interaction.reply({ content: "❌ Invalid bet", ephemeral: true });

      if (!user.money || user.money < bet)
        return interaction.reply({ content: "❌ Not enough money", ephemeral: true });

      const result = Math.floor(Math.random() * 37);

      let win = false;
      let multiplier = 0;

      if (type === "number") {
        if (pick == null || isNaN(pick)) {
          return interaction.reply({ content: "❌ Pick a number", ephemeral: true });
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
        win = result >= 19;
        multiplier = 2;
      }
      else if (type === "low") {
        win = result >= 1 && result <= 18;
        multiplier = 2;
      }
      else {
        return interaction.reply({ content: "❌ Invalid type", ephemeral: true });
      }

      let change = win ? bet * multiplier : -bet;

      user.money = (user.money || 0) + change;

      saveUser(user);

      const embed = new EmbedBuilder()
        .setTitle("🎡 Roulette")
        .setColor(win ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Result", value: `${result}` },
          { name: "Bet", value: `${type}` },
          { name: "Change", value: `${change}` },
          { name: "Outcome", value: win ? "WIN" : "LOSE" }
        );

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("ROULETTE ERROR:", err);
      return interaction.reply({ content: "❌ Failed", ephemeral: true });
    }
  }
};