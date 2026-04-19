const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Show bot system stats"),

  async execute(interaction) {
    try {
      const mem = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();

      const usedRAM = (mem.rss / 1024 / 1024).toFixed(2);
      const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
      const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);

      const systemUsed = ((totalMem - freeMem) / 1024 / 1024).toFixed(2);
      const systemTotal = (totalMem / 1024 / 1024).toFixed(2);

      const cpu = os.loadavg()[0].toFixed(2); // 1 min avg

      const uptime = formatTime(process.uptime());

      const embed = new EmbedBuilder()
        .setTitle("📊 Bot Stats")
        .setColor(0x2b2d31)
        .addFields(
          {
            name: "🧠 Bot Memory",
            value:
              `RSS: ${usedRAM} MB\n` +
              `Heap: ${heapUsed} / ${heapTotal} MB`,
            inline: true
          },
          {
            name: "💻 System Memory",
            value:
              `Used: ${systemUsed} MB\n` +
              `Total: ${systemTotal} MB`,
            inline: true
          },
          {
            name: "⚙️ CPU Load",
            value: `${cpu} (1m avg)`,
            inline: true
          },
          {
            name: "⏱️ Uptime",
            value: uptime,
            inline: true
          }
        )
        .setFooter({ text: "Casino Bot Monitoring" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("BOTINFO ERROR:", err);
      return interaction.reply({
        content: "❌ Failed to fetch stats",
        ephemeral: true
      });
    }
  }
};

// helper
function formatTime(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400);
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor(sec / 60) % 60;
  const s = sec % 60;

  return `${d}d ${h}h ${m}m ${s}s`;
}