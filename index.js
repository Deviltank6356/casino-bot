const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =============================
// LOAD COMMANDS (SAFE + DEDUPED)
// =============================
function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    try {
      const stat = fs.lstatSync(fullPath);

      if (stat.isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      if (!file.endsWith(".js")) continue;

      const cmd = require(fullPath);

      if (!cmd?.data || !cmd?.execute) {
        console.log(`⚠️ Skipped invalid command: ${file}`);
        continue;
      }

      let name;

      try {
        name = cmd.data.toJSON().name;
      } catch {
        console.log(`⚠️ Failed to parse command: ${file}`);
        continue;
      }

      if (!name) {
        console.log(`⚠️ Missing name in: ${file}`);
        continue;
      }

      const key = name.toLowerCase();

      // 🔥 HARD DUPLICATE PREVENTION
      if (client.commands.has(key)) {
        console.error(`❌ Duplicate command blocked: ${key}`);
        continue;
      }

      client.commands.set(key, cmd);
      console.log(`✅ Loaded command: ${key}`);

    } catch (err) {
      console.error(`❌ Failed loading ${file}:`, err);
    }
  }
}

// =============================
loadCommands(path.join(__dirname, "commands"));

// =============================
// READY EVENT
// =============================
client.once("ready", () => {
  console.log(`🚀 Casino bot online as ${client.user.tag}`);
});

// =============================
// INTERACTION HANDLER
// =============================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  const cmd = client.commands.get(i.commandName.toLowerCase());

  if (!cmd) {
    return i.reply({
      content: "❌ Command not found",
      flags: 64
    });
  }

  try {
    await cmd.execute(i, client);

  } catch (err) {
    console.error(`❌ Command error (${i.commandName}):`, err);

    if (!i.replied && !i.deferred) {
      return i.reply({
        content: "❌ Error executing command",
        flags: 64
      });
    }
  }
});

// =============================
client.login(config.token);