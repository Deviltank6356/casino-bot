const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express"); // 🔥 ADDED
const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =============================
// EXPRESS API (LEADERBOARD SUPPORT)
// =============================
const app = express();
app.use(express.json());

// 🔥 ADD YOUR LEADERBOARD ROUTE HERE
const leaderboardRoute = require("./api/leaderboard");
app.use("/api/leaderboard", leaderboardRoute);

// =============================
// HEALTH CHECK (OPTIONAL BUT USEFUL)
// =============================
app.get("/", (req, res) => {
  res.send("Casino bot API running ✔");
});

// =============================
// START API SERVER
// =============================
app.listen(3000, () => {
  console.log("🌐 API running on port 3000");
});

// =============================
// LOAD COMMANDS (SAFE + NO DUPES)
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

      const name = cmd.data?.name || cmd.data?.toJSON?.().name;

      if (!name) {
        console.log(`⚠️ Missing name: ${file}`);
        continue;
      }

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
// INTERACTION HANDLER
// =============================
client.on("interactionCreate", async (interaction) => {
  try {

    // =============================
    // SLASH COMMANDS
    // =============================
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName.toLowerCase());

      if (!cmd) {
        return interaction.reply({
          content: "❌ Command not found",
          ephemeral: true
        });
      }

      try {
        await cmd.execute(interaction, client);
      } catch (err) {
        console.error(`❌ Command error (${interaction.commandName}):`, err);

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Command execution failed",
            ephemeral: true
          });
        }
      }

      return;
    }

    // =============================
    // BUTTONS
    // =============================
    if (interaction.isButton()) {
      const { handleButton } = require("./handlers/buttonRouter");

      try {
        await handleButton(interaction);
      } catch (err) {
        console.error("❌ Button error:", err);

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Button failed",
            ephemeral: true
          });
        }
      }

      return;
    }

  } catch (err) {
    console.error("❌ Interaction crash:", err);

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Unexpected error",
          ephemeral: true
        });
      }
    } catch (e) {
      console.error("❌ Fatal reply failure:", e);
    }
  }
});

// =============================
client.login(config.token);