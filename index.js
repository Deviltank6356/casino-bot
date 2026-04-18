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
      try {
        const cmd = require(full);
        if (cmd?.data?.name) {
          client.commands.set(cmd.data.name, cmd);
        } else {
          console.warn(`Invalid command file skipped: ${full}`);
        }
      } catch (err) {
        console.error(`Failed to load command: ${full}`, err);
      }
    }
  }
}

load(path.join(__dirname, "commands"));

client.once("ready", () => console.log("Casino bot online"));

client.on("interactionCreate", async (i) => {

  if (i.isChatInputCommand()) {

    logCommand(i);

    const cd = check(i.user.id, i.commandName);
    if (cd) return i.reply({ content: `⏳ Wait ${Math.ceil(cd / 1000)}s`, ephemeral: true });

    const cmd = client.commands.get(i.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(i, client);
    } catch (err) {
      console.error("Command error:", err);
      return i.reply({ content: "❌ Command error", ephemeral: true });
    }
  }

  if (i.isButton()) {
    const bj = require("./games/blackjackManager");

    if (i.customId === "hit") {
      const g = bj.hit(i.user.id);
      if (!g) return;
      if (g.over) return i.update({ content: "💥 BUST", components: [] });

      return i.update({ content: `🧑 ${g.player} 🎩 ${g.dealer}`, components: i.message.components });
    }

    if (i.customId === "stand") {
      const g = bj.stand(i.user.id);
      return i.update({ content: `🏁 ${g.player} vs ${g.dealer}`, components: [] });
    }
  }
});

client.login(require("./config.json").token);