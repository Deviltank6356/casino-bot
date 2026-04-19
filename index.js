const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =============================
// LOAD COMMANDS
// =============================
function load(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);

    if (fs.lstatSync(full).isDirectory()) {
      load(full);
      continue;
    }

    const cmd = require(full);

    if (cmd?.data?.name && cmd?.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log("✅ Loaded:", cmd.data.name);
    }
  }
}

load(path.join(__dirname, "commands"));

// =============================
// READY
// =============================
client.once("ready", () => {
  console.log("🚀 Casino bot online");
});

// =============================
// INTERACTIONS
// =============================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  const cmd = client.commands.get(i.commandName);
  if (!cmd) return i.reply({ content: "❌ Not found", ephemeral: true });

  try {
    await cmd.execute(i, client);
  } catch (err) {
    console.error(err);
    if (!i.replied) {
      return i.reply({ content: "❌ Error", ephemeral: true });
    }
  }
});

// =============================
// LOGIN
// =============================
client.login(config.token);