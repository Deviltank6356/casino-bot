const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];

// =============================
// RECURSIVE COMMAND LOADER
// =============================
function loadCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.lstatSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else {
      console.log("Loading:", fullPath);

      const command = require(fullPath);

      if (!command?.data) {
        console.log("❌ NO DATA:", fullPath);
        continue;
      }

      if (!command.data.toJSON) {
        console.log("❌ INVALID COMMAND STRUCTURE:", fullPath);
        continue;
      }

      try {
        commands.push(command.data.toJSON());
      } catch (err) {
        console.log("💥 CRASHING FILE:", fullPath);
        throw err;
      }
    }
  }
}

loadCommands(path.join(__dirname, "commands"));

// =============================
// DISCORD REST CLIENT
// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
// DEPLOY FUNCTION
// =============================
(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} slash commands...`);

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log("✅ Slash commands deployed successfully!");
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
  }
})();