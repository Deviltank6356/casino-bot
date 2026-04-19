const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const seen = new Set();

// =============================
// START LOG (IMPORTANT)
// =============================
console.log("🚀 DEPLOY SCRIPT STARTED");

// =============================
// LOAD COMMANDS (RECURSIVE)
// =============================
function loadCommands(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ DIRECTORY NOT FOUND: ${dir}`);
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

      console.log(`📂 Checking: ${fullPath}`);

      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      if (!command?.data?.toJSON) {
        console.log(`⚠️ Invalid command skipped: ${fullPath}`);
        continue;
      }

      const json = command.data.toJSON();

      if (!json?.name) {
        console.log(`⚠️ Missing name: ${fullPath}`);
        continue;
      }

      const name = json.name.toLowerCase().trim();

      if (seen.has(name)) {
        console.log(`❌ Duplicate skipped: ${name}`);
        continue;
      }

      seen.add(name);
      commands.push(json);

      console.log(`✅ Loaded: ${name}`);

    } catch (err) {
      console.error(`💥 ERROR LOADING FILE: ${fullPath}`);
      console.error(err);
    }
  }
}

// =============================
// LOAD ROOT COMMANDS
// =============================
console.log("📦 Loading commands folder...");
loadCommands(path.join(__dirname, "commands"));
console.log("📦 Loading complete");

// =============================
// SAFETY CHECK
// =============================
if (commands.length === 0) {
  console.error("❌ NO COMMANDS FOUND — check folder structure or file exports");
  process.exit(1);
}

// =============================
// DEPLOY
// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} commands...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${result.length} commands`);

  } catch (err) {
    console.error("❌ DEPLOY FAILED:");
    console.error(err);
  }
})();