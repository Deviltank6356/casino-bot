function loadCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    const stat = fs.lstatSync(fullPath);

    if (stat.isDirectory()) {
      loadCommands(fullPath);
      continue;
    }

    console.log("➡️ RAW FILE:", fullPath);

    if (!file.endsWith(".js")) {
      console.log("⏭️ NOT JS:", file);
      continue;
    }

    try {
      console.log("📥 REQUIRING:", fullPath);

      const command = require(fullPath);

      console.log("📦 EXPORT:", fullPath, command);

      if (!command?.data) {
        console.log("❌ NO DATA:", fullPath);
        continue;
      }

      const json = command.data.toJSON?.();

      console.log("📄 JSON:", json);

      commands.push(json);
      console.log("✅ ADDED:", json?.name);

    } catch (err) {
      console.error("💥 CRASH IN FILE:", fullPath);
      console.error(err);
    }
  }
}