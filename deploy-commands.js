const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const seen = new Set();

// =============================
// LOAD COMMANDS (HARD DEBUG VERSION)
// =============================
function loadCommands(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ MISSING DIRECTORY: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    console.log(`📂 Checking: ${fullPath}`);

    try {
      const stat = fs.lstatSync(fullPath);

      // =============================
      // RECURSIVE FOLDERS
      // =============================
      if (stat.isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      if (!file.endsWith(".js")) {
        console.log(`⏭️ SKIP (not js): ${file}`);
        continue;
      }

      // =============================
      // LOAD FILE (SHOW REAL ERRORS)
      // =============================
      delete require.cache[require.resolve(fullPath)];

      let command;
      try {
        command = require(fullPath);
      } catch (err) {
        console.error(`💥 REQUIRE FAILED: ${fullPath}`);
        console.error(err.stack || err);
        continue;
      }

      if (!command) {
        console.warn(`⚠️ EMPTY EXPORT: ${fullPath}`);
        continue;
      }

      if (!command.data) {
        console.warn(`⚠️ NO DATA EXPORT: ${fullPath}`);
        continue;
      }

      if (typeof command.data.toJSON !== "function") {
        console.warn(`⚠️ INVALID SlashCommandBuilder: ${fullPath}`);
        continue;
      }

      let json;
      try {
        json = command.data.toJSON();
      } catch (err) {
        console.error(`❌ toJSON FAILED: ${fullPath}`);
        console.error(err.stack || err);
        continue;
      }

      if (!json?.name) {
        console.warn(`⚠️ NO COMMAND NAME: ${fullPath}`);
        continue;
      }

      const name = json.name.toLowerCase().trim();

      // =============================
      // DUPLICATE CHECK (STRICT)
      // =============================
      if (seen.has(name)) {
        console.error(`❌ DUPLICATE IGNORED: ${name} (${fullPath})`);
        continue;
      }

      seen.add(name);
      commands.push(json);

      console.log(`✅ LOADED COMMAND: ${name}`);

    } catch (err) {
      console.error(`💥 FILE ERROR: ${fullPath}`);
      console.error(err.stack || err);
    }
  }
}

// =============================
// LOAD MULTIPLE ROOTS (IMPORTANT FIX)
// =============================
loadCommands(path.join(__dirname, "commands"));
loadCommands(path.join(__dirname, "utils")); // 🔥 THIS FIXES YOUR ISSUE

// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
(async () => {
  try {
    console.log(`🚀 FINAL COMMAND COUNT: ${commands.length}`);

    if (commands.length === 0) {
      console.error("❌ NO COMMANDS LOADED — CHECK FILE STRUCTURE");
      return;
    }

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(`✅ DEPLOYED: ${result.length} commands`);

  } catch (err) {
    console.error("❌ DEPLOY FAILED:");
    console.error(err.stack || err);
  }
})();