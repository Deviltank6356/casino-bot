const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testcommands")
    .setDescription("🧪 Full command validation system (owner only)"),

  async execute(interaction) {
    const baseDir = path.join(__dirname, "../../commands");

    let total = 0;
    let passed = 0;
    let failed = 0;

    const errors = [];
    const seen = new Set();

    // =============================
    // SAFE FILE SCAN (FIXED)
    // =============================
    async function scan(dir) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const full = path.join(dir, file);

        if (fs.lstatSync(full).isDirectory()) {
          await scan(full); // 🔥 FIXED
          continue;
        }

        if (!file.endsWith(".js")) continue;

        total++;

        const start = Date.now();

        try {
          delete require.cache[require.resolve(full)];
          const cmd = require(full);

          // =============================
          // STRUCTURE CHECK
          // =============================
          if (!cmd?.data) throw new Error("Missing 'data'");
          if (typeof cmd.data.toJSON !== "function") {
            throw new Error("Invalid SlashCommandBuilder");
          }

          const json = cmd.data.toJSON();

          if (!json?.name) throw new Error("Missing command name");

          // =============================
          // DUPLICATES
          // =============================
          if (seen.has(json.name)) {
            throw new Error(`Duplicate command: ${json.name}`);
          }

          seen.add(json.name);

          // =============================
          // EXEC CHECK
          // =============================
          if (typeof cmd.execute !== "function") {
            throw new Error("Missing execute()");
          }

          const fakeInteraction = {
            user: { id: "test" },
            options: {
              getString: () => null,
              getInteger: () => null,
              getUser: () => null
            },
            reply: async () => {},
            deferReply: async () => {},
            editReply: async () => {}
          };

          // safe execution test
          await Promise.race([
            cmd.execute(fakeInteraction, null),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout > 1.5s")), 1500)
            )
          ]);

          passed++;

        } catch (err) {
          failed++;
          errors.push(`❌ ${file} → ${err.message}`);
        }
      }
    }

    try {
      await scan(baseDir); // 🔥 FIXED
    } catch (err) {
      return interaction.reply({
        content: `❌ Scan failed: ${err.message}`,
        ephemeral: true
      });
    }

    // =============================
    // REPORT
    // =============================
    const successRate = total
      ? Math.floor((passed / total) * 100)
      : 0;

    let output =
      `🧪 **COMMAND SYSTEM DIAGNOSTIC**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 Total: ${total}\n` +
      `✅ Passed: ${passed}\n` +
      `❌ Failed: ${failed}\n` +
      `📊 Success: ${successRate}%\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (errors.length > 0) {
      output += errors.slice(0, 10).join("\n");

      if (errors.length > 10) {
        output += `\n... +${errors.length - 10} more`;
      }
    } else {
      output += "🎉 All commands passed validation!";
    }

    return interaction.reply({
      content: output,
      ephemeral: true
    });
  }
};