const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const seen = new Set();

// =============================
// LOAD COMMANDS
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

      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);

      if (!command?.data?.toJSON) {
        console.warn(`⚠️ Invalid command skipped: ${fullPath}`);
        continue;
      }

      const json = command.data.toJSON();

      if (!json?.name) {
        console.warn(`⚠️ Missing name: ${fullPath}`);
        continue;
      }

      // =============================
      // DUPLICATE CHECK (NO RENAMING)
      // =============================
      if (seen.has(json.name)) {
        console.error(`❌ Duplicate command ignored: ${json.name}`);
        continue; // IMPORTANT: skip instead of renaming
      }

      seen.add(json.name);
      commands.push(json);

      console.log(`✅ Loaded: ${json.name}`);

    } catch (err) {
      console.error(`💥 Failed loading: ${fullPath}`, err);
    }
  }
}

loadCommands(path.join(__dirname, "commands"));

// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} commands...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(`✅ Deployed ${result.length} commands`);
  } catch (err) {
    console.error("❌ Deploy failed:", err);
  }
})();