const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

let logChannel = null;

// =============================
// GET LOG CHANNEL (SAFE CACHE)
// =============================
async function getLogChannel(client) {
  try {
    if (!config.logChannelId) return null;

    // If cached channel still exists, reuse it
    if (logChannel) return logChannel;

    const channel = await client.channels.fetch(config.logChannelId).catch(() => null);

    if (!channel) {
      console.error("❌ Log channel not found or inaccessible");
      return null;
    }

    logChannel = channel;
    return channel;

  } catch (err) {
    console.error("❌ Failed to fetch log channel:", err);
    logChannel = null; // reset cache so next attempt retries
    return null;
  }
}

// =============================
// LOG ADMIN ACTION
// =============================
async function logAdminAction(client, interaction, action, details = "") {
  try {
    const channel = await getLogChannel(client);
    if (!channel) return;

    const user = interaction?.user ?? interaction?.author ?? null;

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Admin Action Log")
      .setColor(0xff0000)
      .addFields(
        {
          name: "Action",
          value: action ? String(action) : "Unknown",
          inline: true
        },
        {
          name: "User",
          value: user ? `${user.tag} (${user.id})` : "Unknown",
          inline: false
        },
        {
          name: "Details",
          value: details ? String(details).slice(0, 1024) : "None",
          inline: false
        }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });

  } catch (err) {
    // never crash bot due to logging
    console.error("❌ logAdminAction failed:", err);
  }
}

module.exports = { logAdminAction };