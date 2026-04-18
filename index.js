const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const { check } = require("./systems/cooldowns");
const { logCommand } = require("./services/logger");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

function load(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);

    if (fs.lstatSync(full).isDirectory()) {
      load(full);
    } else {
      console.log("📄 Loading file:", full);

      try {
        const cmd = require(full);

        console.log("➡️ Loaded module keys:", Object.keys(cmd || {}));

        if (cmd?.data?.name) {
          client.commands.set(cmd.data.name, cmd);
          console.log("✅ Registered command:", cmd.data.name);
        } else {
          console.warn("⚠️ Invalid command file skipped:", full);
        }

      } catch (err) {
        console.error("❌ Failed to load command:", full, err);
      }
    }
  }
}

load(path.join(__dirname, "commands"));

client.once("ready", () => {
  console.log("🚀 Casino bot online");
});

client.on("interactionCreate", async (i) => {

  console.log("🔥 INTERACTION RECEIVED:", i.commandName || i.customId);

  if (i.isChatInputCommand()) {

    console.log("➡️ CHAT COMMAND:", i.commandName);

    try {
      logCommand(i);

      console.log("⏳ Running cooldown check...");
      const cd = check(i.user.id, i.commandName);
      console.log("⏳ Cooldown result:", cd);

      if (cd) {
        console.log("❌ Cooldown active");
        return i.reply({ content: `⏳ Wait ${Math.ceil(cd / 1000)}s`, ephemeral: true });
      }

      const cmd = client.commands.get(i.commandName);
      console.log("📦 Command lookup result:", !!cmd);

      if (!cmd) {
        console.log("❌ COMMAND NOT FOUND:", i.commandName);
        return;
      }

      console.log("🚀 Executing command:", i.commandName);
      await cmd.execute(i, client);

    } catch (err) {
      console.error("💥 COMMAND HANDLER ERROR:", err);
    }
  }

  if (i.isButton()) {

    console.log("🔘 BUTTON CLICKED:", i.customId);

    const bj = require("./games/blackjackManager");

    if (i.customId === "hit") {
      const g = bj.hit(i.user.id);
      console.log("🎮 HIT RESULT:", g);

      if (!g) return;
      if (g.over) return i.update({ content: "💥 BUST", components: [] });

      return i.update({
        content: `🧑 ${g.player} 🎩 ${g.dealer}`,
        components: i.message.components
      });
    }

    if (i.customId === "stand") {
      const g = bj.stand(i.user.id);
      console.log("🏁 STAND RESULT:", g);

      return i.update({
        content: `🏁 ${g.player} vs ${g.dealer}`,
        components: []
      });
    }
  }
});

client.login(require("./config.json").token);

require("./auth");