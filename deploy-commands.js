const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const seen = new Set();

// =============================
// SAFE LOAD
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

      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      if (!command?.data?.toJSON) {
        console.warn(`⚠️ Invalid command skipped: ${fullPath}`);
        continue;
      }

      let json;
      try {
        json = command.data.toJSON();
      } catch (e) {
        console.error(`❌ toJSON failed: ${fullPath}`, e);
        continue;
      }

      if (!json?.name) {
        console.warn(`⚠️ Missing name: ${fullPath}`);
        continue;
      }

      // normalize name
      const name = json.name.toLowerCase().trim();

      // strict duplicate protection
      if (seen.has(name)) {
        console.error(`❌ Duplicate command ignored: ${name}`);
        continue;
      }

      seen.add(name);
      commands.push(json);

      console.log(`✅ Loaded: ${name}`);

    } catch (err) {
      console.error(`💥 Failed loading: ${fullPath}`, err);
    }
  }
}

// =============================
loadCommands(path.join(__dirname, "commands"));

// =============================
// FINAL CLEANUP (EXTRA SAFETY)
// =============================
const uniqueCommands = [];
const finalSeen = new Set();

for (const cmd of commands) {
  const name = cmd.name.toLowerCase();

  if (finalSeen.has(name)) continue;

  finalSeen.add(name);
  uniqueCommands.push(cmd);
}

// =============================
const rest = new REST({ version: "10" }).setToken(config.token);

// =============================
(async () => {
  try {
    console.log(`🚀 Deploying ${uniqueCommands.length} commands...`);

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: uniqueCommands }
    );

    console.log(`✅ Successfully deployed ${result.length} commands`);

  } catch (err) {
    console.error("❌ Deploy failed:", err);
  }
})();