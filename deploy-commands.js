const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const seen = new Set();

// =============================
// LOAD COMMANDS (RECURSIVE + SAFE)
// =============================
function loadCommands(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Missing directory: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    try {
      const stat = fs.lstatSync(fullPath);

      // folder → recurse
      if (stat.isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      if (!file.endsWith(".js")) continue;

      console.log(`📂 Found: ${fullPath}`);

      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      if (!command?.data?.toJSON) {
        console.warn(`⚠️ Skipped invalid command: ${fullPath}`);
        continue;
      }

      const json = command.data.toJSON();

      if (!json?.name) {
        console.warn(`⚠️ Missing name: ${fullPath}`);
        continue;
      }

      const name = json.name.toLowerCase().trim();

      if (seen.has(name)) {
        console.error(`❌ Duplicate skipped: ${name}`);
        continue;
      }

      seen.add(name);
      commands.push(json);

      console.log(`✅ Loaded: ${name}`);

    } catch (err) {
      console.error(`💥 Error loading: ${fullPath}`);
      console.error(err.stack || err);
    }
  }
}

// =============================
// IMPORTANT: ONLY ONE ROOT SCAN
// =============================
loadCommands(path.join(__dirname, "commands"));

// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} commands...`);

    if (commands.length === 0) {
      console.error("❌ No commands found — check folder structure");
      return;
    }

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${result.length} commands`);

  } catch (err) {
    console.error("❌ Deploy failed:");
    console.error(err);
  }
})();