const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("🏆 View global leaderboard"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // =============================
      // FETCH WITH TIMEOUT (ANTI HANG)
      // =============================
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        "https://YOUR-WORKER.workers.dev/leaderboard?limit=10",
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const data = await res.json();

      const list = data?.leaderboard;

      if (!data?.success || !Array.isArray(list)) {
        return interaction.editReply("❌ Failed to load leaderboard");
      }

      // =============================
      // FORMAT
      // =============================
      const desc =
        list.length > 0
          ? list
              .map((u, i) => {
                const rank = u.rank ?? i + 1;
                const money = Number(u.money ?? 0).toLocaleString();

                return `**#${rank}** <@${u.userId}> — 💰 ${money}`;
              })
              .join("\n")
          : "No players yet.";

      // =============================
      // EMBED
      // =============================
      const embed = new EmbedBuilder()
        .setTitle("🏆 Global Leaderboard")
        .setColor(0xf1c40f)
        .setDescription(desc)
        .setFooter({ text: "Casino Leaderboard • Top Players" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("Leaderboard error:", err);

      return interaction.editReply("❌ Unable to fetch leaderboard.");
    }
  }
};