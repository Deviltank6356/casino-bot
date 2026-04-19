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
          // clear cache so edits are tested properly
          delete require.cache[require.resolve(full)];

          const cmd = require(full);

          // =========================
          // VALIDATION
          // =========================
          if (!cmd || !cmd.data) {
            failed++;
            errors.push(`❌ ${file} → missing data`);
            continue;
          }

          if (typeof cmd.data.toJSON !== "function") {
            failed++;
            errors.push(`❌ ${file} → invalid SlashCommandBuilder`);
            continue;
          }

          const json = cmd.data.toJSON();

          if (!json?.name || typeof json.name !== "string") {
            failed++;
            errors.push(`❌ ${file} → invalid or missing name`);
            continue;
          }

          // =========================
          // DUPLICATE CHECK
          // =========================
          if (seen.has(json.name)) {
            failed++;
            errors.push(`⚠️ duplicate command → ${json.name}`);
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

    try {
      scan(baseDir);
    } catch (err) {
      return interaction.reply({
        content: `❌ Fatal scan error: ${err.message}`,
        ephemeral: true
      });
    }

    // =========================
    // OUTPUT
    // =========================
    let output =
      `🧪 **COMMAND TEST RESULTS**\n` +
      `━━━━━━━━━━━━━━\n` +
      `📦 Total: ${total}\n` +
      `✅ Passed: ${passed}\n` +
      `❌ Failed: ${failed}\n` +
      `━━━━━━━━━━━━━━\n`;

    if (errors.length > 0) {
      output += errors.slice(0, 15).join("\n");

      if (errors.length > 15) {
        output += `\n...and ${errors.length - 15} more errors`;
      }
    } else {
      output += "🎉 All commands valid!";
    }

    return interaction.reply({
      content: output,
      ephemeral: true
    });
  }
};