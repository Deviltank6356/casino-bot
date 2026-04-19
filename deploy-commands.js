const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [];
const nameCount = new Map();

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

      const command = require(fullPath);

      if (!command?.data?.toJSON) continue;

      const json = command.data.toJSON();
      if (!json?.name) continue;

      // =============================
      // AUTO FIX DUPLICATES
      // =============================
      let name = json.name;

      if (nameCount.has(name)) {
        const count = nameCount.get(name) + 1;
        nameCount.set(name, count);

        const newName = `${name}_${count}`;
        console.warn(`⚠️ Duplicate detected: ${name} → renamed to ${newName}`);

        json.name = newName;
      } else {
        nameCount.set(name, 1);
      }

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