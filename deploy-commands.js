function loadCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    try {
      const stat = fs.lstatSync(fullPath);

      // recursive folders
      if (stat.isDirectory()) {
        loadCommands(fullPath);
        continue;
      }

      if (!file.endsWith(".js")) continue;

      console.log(`📂 Checking: ${fullPath}`);

      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      if (!command?.data?.toJSON) {
        console.log(`⚠️ Skipped invalid command: ${fullPath}`);
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
      console.error(`💥 Error loading: ${fullPath}`);
      console.error(err);
    }
  }
}