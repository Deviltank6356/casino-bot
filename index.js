const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const { check } = require("./systems/cooldowns");
const { logCommand } = require("./services/logger");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// =============================
// COMMAND LOADER
// =============================
function load(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);

    if (fs.lstatSync(full).isDirectory()) {
      load(full);
    } else {
      console.log("📄 Loading file:", full);

      try {
        const cmd = require(full);

        if (cmd?.data?.name && typeof cmd.execute === "function") {
          client.commands.set(cmd.data.name, cmd);
          console.log("✅ Registered:", cmd.data.name);
        } else {
          console.warn("⚠️ Invalid command skipped:", full);
        }

      } catch (err) {
        console.error("❌ Failed loading:", full, err);
      }
    }
  }
}

load(path.join(__dirname, "commands"));

// =============================
// READY EVENT
// =============================
client.once("ready", () => {
  console.log("🚀 Casino bot online");
});

// =============================
// INTERACTIONS
// =============================
client.on("interactionCreate", async (i) => {

  console.log("🔥 INTERACTION:", i.commandName || i.customId);

  // =============================
  // SLASH COMMANDS
  // =============================
  if (i.isChatInputCommand()) {

    try {
      logCommand(i);

      console.log("➡️ COMMAND:", i.commandName);

      const cd = check(i.user.id, i.commandName);
      console.log("⏳ Cooldown:", cd);

      if (cd) {
        return i.reply({
          content: `⏳ Wait ${Math.ceil(cd / 1000)}s`,
          ephemeral: true
        });
      }

      const cmd = client.commands.get(i.commandName);

      if (!cmd) {
        console.log("❌ Command not found:", i.commandName);
        return i.reply({ content: "❌ Command not found", ephemeral: true });
      }

      console.log("🚀 Executing:", i.commandName);

      await cmd.execute(i, client);

    } catch (err) {
      console.error("💥 COMMAND ERROR:", err);

      if (!i.replied) {
        return i.reply({
          content: "❌ Command crashed",
          ephemeral: true
        });
      }
    }
  }

  // =============================
  // BUTTONS (BLACKJACK FIXED)
  // =============================
  if (i.isButton()) {

    console.log("🔘 BUTTON:", i.customId);

    const bj = require("./games/blackjackManager");

    const game = bj.getGame(i.user.id);
    if (!game) {
      return i.reply({
        content: "❌ No active blackjack game",
        ephemeral: true
      });
    }

    try {

      if (i.customId === "hit") {
        const g = bj.hit(i.user.id);

        if (!g) return;

        if (g.over) {
          return i.update({
            content: `💥 BUST!\n🧑 ${g.player} vs 🎩 ${g.dealer}\n🏁 YOU LOSE`,
            components: []
          });
        }

        return i.update({
          content: `🧑 ${g.player} vs 🎩 ${g.dealer}`,
          components: i.message.components
        });
      }

      if (i.customId === "stand") {
        const g = bj.stand(i.user.id);

        let result = "LOSE";
        if (g.result === "win") result = "WIN";
        if (g.result === "push") result = "PUSH";

        return i.update({
          content:
            `🏁 FINAL RESULT\n` +
            `🧑 ${g.player}\n` +
            `🎩 ${g.dealer}\n` +
            `💰 RESULT: ${result}`,
          components: []
        });
      }

    } catch (err) {
      console.error("💥 BUTTON ERROR:", err);

      return i.reply({
        content: "❌ Button error",
        ephemeral: true
      });
    }
  }
});

// =============================
// LOGIN
// =============================
client.login(require("./config.json").token);

require("./auth");