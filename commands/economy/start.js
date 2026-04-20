const { SlashCommandBuilder } = require("discord.js");
const { getUser, saveUser } = require("../../db");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Begin your journey"),

  async execute(interaction) {
    let user;

    try {
      user = getUser(interaction.user.id);
    } catch (err) {
      console.error("GET USER FAILED:", err);

      return interaction.reply({
        content: "❌ Failed to load your profile. Try again.",
        ephemeral: true
      });
    }

    // 🔧 FORCE FIX BROKEN USERS (after reset)
    if (typeof user.started !== "number") user.started = 0;
    if (typeof user.money !== "number") user.money = 0;
    if (typeof user.bank !== "number") user.bank = 0;
    if (typeof user.xp !== "number") user.xp = 0;
    if (typeof user.level !== "number") user.level = 0;

    // 🔒 already started
    if (user.started === 1) {
      return interaction.reply({
        content: "❌ You already ran /start",
        ephemeral: true
      });
    }

    // ✅ initialise user safely
    user.money = config.startingMoney ?? 1000;
    user.bank = config.startingBank ?? 500;
    user.xp = 0;
    user.level = 0;
    user.started = 1;

    try {
      saveUser(user);
    } catch (err) {
      console.error("SAVE USER FAILED:", err);

      return interaction.reply({
        content: "❌ Failed to save your data.",
        ephemeral: true
      });
    }

    return interaction.reply({
      content:
        "🎉 Started!\n" +
        `💰 Wallet: ${user.money}\n` +
        `🏦 Bank: ${user.bank}`,
      ephemeral: true
    });
  }
};