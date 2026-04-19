const fs = require("fs");
const path = require("path");

function clearRequireCache(file) {
  delete require.cache[require.resolve(file)];
}

function watchCommands(client, dir = "./commands") {
  const fullDir = path.resolve(dir);

  fs.watch(fullDir, { recursive: true }, (event, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const fullPath = path.join(fullDir, filename);

    try {
      clearRequireCache(fullPath);

      const cmd = require(fullPath);

      if (!cmd?.data?.toJSON) return;

      const name = cmd.data.toJSON().name;

      client.commands.set(name, cmd);

      console.log(`♻️ Reloaded command: ${name}`);

    } catch (err) {
      console.error(`❌ Hot reload failed: ${filename}`, err.message);
    }
  });

  console.log("🔥 Hot reload enabled");
}

module.exports = { watchCommands };