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
      const stat = fs.lstatSync(fullPath);

      if (stat.isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      if (!file.endsWith(".js")) continue;

      // clear cache (important for PM2)
      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      // =============================
      // VALIDATION 1: structure
      // =============================
      if (!command || !command.data) {
        console.warn(`⚠️ SKIP (no command.data): ${fullPath}`);
        continue;
      }

      if (typeof command.data.toJSON !== "function") {
        console.warn(`⚠️ SKIP (no toJSON): ${fullPath}`);
        continue;
      }

      let json;
      try {
        json = command.data.toJSON();
      } catch (e) {
        console.error(`❌ toJSON ERROR: ${fullPath}`, e);
        continue;
      }

      if (!json?.name) {
        console.warn(`⚠️ SKIP (missing name): ${fullPath}`);
        continue;
      }

      // =============================
      // VALIDATION 2: normalize name
      // =============================
      const name = json.name.toLowerCase().trim();

      if (!/^[a-z0-9-]+$/.test(name)) {
        console.error(`❌ INVALID COMMAND NAME (must be lowercase, no spaces): ${name} (${fullPath})`);
        continue;
      }

      // =============================
      // VALIDATION 3: duplicates
      // =============================
      if (seen.has(name)) {
        console.error(`❌ DUPLICATE IGNORED: ${name} (${fullPath})`);
        continue;
      }

      seen.add(name);
      commands.push(json);

      console.log(`✅ LOADED: ${name} (${file})`);

    } catch (err) {
      console.error(`💥 FAILED FILE: ${fullPath}`, err);
    }
  }
}

// =============================
loadCommands(path.join(__dirname, "commands"));

// =============================
// FINAL SAFETY DEDUPLICATION
// =============================
const unique = [];
const final = new Set();

for (const cmd of commands) {
  if (!cmd?.name) continue;

  const name = cmd.name.toLowerCase().trim();

  if (final.has(name)) {
    console.error(`❌ FINAL DROP DUPLICATE: ${name}`);
    continue;
  }

  final.add(name);
  unique.push(cmd);
}

// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
(async () => {
  try {
    console.log(`🚀 Deploying ${unique.length} commands...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: unique }
    );

    console.log(`✅ DEPLOYED: ${result.length} commands`);

  } catch (err) {
    console.error("❌ DEPLOY FAILED:", err);
  }
})();