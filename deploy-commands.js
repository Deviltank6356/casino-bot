const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const seen = new Set();

// =============================
// LOAD COMMANDS (DEBUG VERSION)
// =============================
function loadCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    console.log(`📂 Checking: ${fullPath}`);

    try {
      const stat = fs.lstatSync(fullPath);

      if (stat.isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      if (!file.endsWith(".js")) {
        console.log(`⏭️ SKIP (not js): ${file}`);
        continue;
      }

      delete require.cache[require.resolve(fullPath)];

      let command;
      try {
        command = require(fullPath);
      } catch (e) {
        console.error(`💥 REQUIRE FAILED: ${fullPath}`);
        console.error(e);
        continue;
      }

      console.log(`📦 LOADED FILE: ${file}`, command);

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
      } catch (e) {
        console.error(`❌ toJSON CRASH: ${fullPath}`, e);
        continue;
      }

      if (!json?.name) {
        console.warn(`⚠️ NO NAME: ${fullPath}`);
        continue;
      }

      const name = json.name.toLowerCase().trim();

      if (seen.has(name)) {
        console.error(`❌ DUPLICATE: ${name}`);
        continue;
      }

      seen.add(name);
      commands.push(json);

      console.log(`✅ LOADED COMMAND: ${name}`);

    } catch (err) {
      console.error(`💥 FILE ERROR: ${fullPath}`, err);
    }
  }
}

// =============================
loadCommands(path.join(__dirname, "commands"));

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
    console.error("❌ DEPLOY FAILED:", err);
  }
})();