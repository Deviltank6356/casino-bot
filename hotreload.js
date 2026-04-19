const fs = require("fs");
const path = require("path");

function clearRequireCache(file) {
  delete require.cache[require.resolve(file)];
}

// simple debounce map to prevent spam reloads
const debounce = new Map();

function watchCommands(client, dir = "./commands") {
  const fullDir = path.resolve(dir);

  fs.watch(fullDir, { recursive: true }, (event, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const fullPath = path.join(fullDir, filename);

    // debounce (prevents double triggers)
    const now = Date.now();
    if (debounce.get(fullPath) && now - debounce.get(fullPath) < 200) return;
    debounce.set(fullPath, now);

    try {
      // remove old version from cache
      clearRequireCache(fullPath);

      // re-require fresh module
      const cmd = require(fullPath);

      // validate command structure safely
      if (!cmd || !cmd.data || !cmd.data.name) {
        console.warn(`⚠️ Invalid command skipped: ${filename}`);
        return;
      }

      const name =
        typeof cmd.data.toJSON === "function"
          ? cmd.data.toJSON().name
          : cmd.data.name;

      client.commands.set(name, cmd);

      console.log(`♻️ Reloaded command: ${name}`);

    } catch (err) {
      console.error(`❌ Hot reload failed: ${filename}`, err.message);
    }
  });

  console.log("🔥 Hot reload enabled");
}

module.exports = { watchCommands };