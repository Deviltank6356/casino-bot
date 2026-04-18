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

    try {
      if (fs.lstatSync(fullPath).isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      // console.log("📄 Loading:", fullPath); // DEBUG (disabled)

      const command = require(fullPath);

      if (!command?.data) {
        // console.log("❌ NO DATA:", fullPath); // DEBUG (disabled)
        continue;
      }

      if (typeof command.data.toJSON !== "function") {
        // console.log("❌ INVALID COMMAND STRUCTURE:", fullPath); // DEBUG (disabled)
        continue;
      }

      commands.push(command.data.toJSON());

      // console.log("✅ Loaded command"); // DEBUG (disabled)

    } catch (err) {
      console.error("💥 Failed loading command:", fullPath);
      console.error(err);
    }
  }
}

loadCommands(path.join(__dirname, "commands"));

// =============================
// DISCORD REST CLIENT
// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
// DEPLOY COMMANDS
// =============================
(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} slash commands...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(`✅ Deployed ${result.length} commands`);
  } catch (error) {
    console.error("❌ Deploy failed:", error);
  }
})();