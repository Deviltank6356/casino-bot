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
      const command = require(fullPath);

      if (command?.data?.toJSON) {
        commands.push(command.data.toJSON());
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

    // Guild commands (instant update, best for development)
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log("✅ Slash commands deployed successfully!");
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
  }
})();