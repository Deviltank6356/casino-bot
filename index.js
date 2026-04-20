const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =============================
// LOAD COMMANDS (SAFE)
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
        console.log(`⚠️ Invalid command skipped: ${file}`);
        continue;
      }

      let name;
      try {
        name = cmd.data.name || cmd.data.toJSON().name;
      } catch {
        console.log(`⚠️ Failed parsing command: ${file}`);
        continue;
      }

      if (!name) continue;

      const key = name.toLowerCase();

      if (client.commands.has(key)) {
        console.error(`❌ Duplicate blocked: ${key}`);
        continue;
      }

      client.commands.set(key, cmd);
      console.log(`✅ Loaded: ${key}`);

    } catch (err) {
      console.error(`❌ Load error ${file}:`, err);
    }
  }
}

loadCommands(path.join(__dirname, "commands"));

// =============================
// READY
// =============================
client.once("ready", () => {
  console.log(`🚀 Online as ${client.user.tag}`);
});

// =============================
// INTERACTIONS (FIXED CORE BUG)
// =============================
client.on("interactionCreate", async (interaction) => {
  try {

    // =============================
    // SLASH COMMANDS ONLY
    // =============================
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.get(interaction.commandName.toLowerCase());

    if (!cmd) {
      return interaction.reply({
        content: "❌ Command not found",
        flags: 64
      });
    }

    // =============================
    // EXECUTION SAFETY
    // =============================
    await cmd.execute(interaction, client);

  } catch (err) {
    console.error(`❌ Interaction error:`, err);

    try {
      if (interaction.replied || interaction.deferred) return;

      await interaction.reply({
        content: "❌ Unexpected error executing command",
        flags: 64
      });
    } catch (e) {
      console.error("❌ Failed to send error reply:", e);
    }
  }
});

// =============================
client.login(config.token);