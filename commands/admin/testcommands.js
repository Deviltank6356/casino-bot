const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testcommands")
    .setDescription("Validate all commands (owner only)"),

  async execute(interaction) {
    const baseDir = path.join(__dirname, "../../commands");

    let total = 0;
    let passed = 0;
    let failed = 0;
    const errors = [];
    const seen = new Set();

    function scan(dir) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const full = path.join(dir, file);

        if (fs.lstatSync(full).isDirectory()) {
          scan(full);
          continue;
        }

        total++;

        try {
          delete require.cache[require.resolve(full)];
          const cmd = require(full);

          if (!cmd || !cmd.data) {
            failed++;
            errors.push(`❌ ${file} → missing command data`);
            continue;
          }

          if (typeof cmd.data.toJSON !== "function") {
            failed++;
            errors.push(`❌ ${file} → invalid SlashCommandBuilder`);
            continue;
          }

          const json = cmd.data.toJSON();

          if (!json?.name) {
            failed++;
            errors.push(`❌ ${file} → missing name`);
            continue;
          }

          if (seen.has(json.name)) {
            failed++;
            errors.push(`⚠️ duplicate → ${json.name}`);
            continue;
          }

          seen.add(json.name);
          passed++;

        } catch (err) {
          failed++;
          errors.push(`💥 ${file} → ${err.message}`);
        }
      }
    }

    scan(baseDir);

    const embedText =
      `🧪 **COMMAND TEST RESULTS**\n` +
      `━━━━━━━━━━━━━━\n` +
      `📦 Total: ${total}\n` +
      `✅ Passed: ${passed}\n` +
      `❌ Failed: ${failed}\n` +
      `━━━━━━━━━━━━━━\n` +
      (errors.length
        ? errors.slice(0, 15).join("\n")
        : "🎉 All commands valid!");

    return interaction.reply({
      content: embedText,
      ephemeral: true
    });
  }
};