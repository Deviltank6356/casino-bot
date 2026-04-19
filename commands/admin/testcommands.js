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

        try {
          if (fs.lstatSync(full).isDirectory()) {
            scan(full);
            continue;
          }

          total++;

          const cmd = require(full);

          if (!cmd?.data) {
            failed++;
            errors.push(`❌ ${file} → missing data`);
            return;
          }

          if (typeof cmd.data.toJSON !== "function") {
            failed++;
            errors.push(`❌ ${file} → invalid structure`);
            return;
          }

          const json = cmd.data.toJSON();

          if (seen.has(json.name)) {
            failed++;
            errors.push(`⚠️ ${file} → duplicate name (${json.name})`);
            return;
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

    let output =
      `🧪 **COMMAND TEST RESULTS**\n` +
      `━━━━━━━━━━━━━━\n` +
      `📦 Total: ${total}\n` +
      `✅ Passed: ${passed}\n` +
      `❌ Failed: ${failed}\n` +
      `━━━━━━━━━━━━━━\n`;

    if (errors.length > 0) {
      output += errors.slice(0, 10).join("\n");

      if (errors.length > 10) {
        output += `\n...and ${errors.length - 10} more`;
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