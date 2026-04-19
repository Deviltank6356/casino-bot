const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =============================
// SAFE REQUIRE CACHE CLEAR
// =============================
function clearRequireCache(file) {
  delete require.cache[require.resolve(file)];
}

// =============================
// LOAD COMMANDS (RECURSIVE)
// =============================
function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    const stat = fs.lstatSync(fullPath);

    if (stat.isDirectory()) {
      loadCommands(fullPath);
      continue;
    }

    if (!file.endsWith(".js")) continue;

    try {
      clearRequireCache(fullPath);

      const cmd = require(fullPath);

      if (cmd?.data?.name && typeof cmd.execute === "function") {
        client.commands.set(cmd.data.name, cmd);
        console.log("✅ Loaded:", cmd.data.name);
      } else {
        console.log("⚠️ Skipped invalid command:", file);
      }

    } catch (err) {
      console.error(`❌ Failed loading ${file}:`, err.message);
    }
  }
}

// =============================
// INIT LOAD
// =============================
loadCommands(path.join(__dirname, "commands"));

// =============================
// READY
// =============================
client.once("ready", () => {
  console.log("🚀 Casino bot online");
});

// =============================
// INTERACTION HANDLER
// =============================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  const cmd = client.commands.get(i.commandName);

  if (!cmd) {
    return i.reply({
      content: "❌ Command not found",
      ephemeral: true
    });
  }

  try {
    await cmd.execute(i, client);

  } catch (err) {
    console.error(`❌ Command error (${i.commandName}):`, err);

    if (!i.replied && !i.deferred) {
      return i.reply({
        content: "❌ Error executing command",
        ephemeral: true
      });
    }
  }
});

// =============================
// LOGIN
// =============================
client.login(config.token);