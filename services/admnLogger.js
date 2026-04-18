const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

async function logAdminAction(client, interaction, action, details = "") {
  const channel = await client.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("🛡️ Admin Action Log")
    .setColor("Red")
    .addFields(
      { name: "Action", value: action, inline: true },
      { name: "User", value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
      { name: "Details", value: details || "None", inline: false }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
}

module.exports = { logAdminAction };