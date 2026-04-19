const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

// cache channel so we don't fetch every time
let logChannel = null;

// =============================
// GET LOG CHANNEL (CACHED)
// =============================
async function getLogChannel(client) {
  if (logChannel) return logChannel;

  try {
    logChannel = await client.channels.fetch(config.logChannelId);
    return logChannel;
  } catch (err) {
    console.error("❌ Failed to fetch log channel:", err);
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

    const user = interaction?.user;

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Admin Action Log")
      .setColor(0xff0000)
      .addFields(
        {
          name: "Action",
          value: String(action || "Unknown"),
          inline: true
        },
        {
          name: "User",
          value: user
            ? `${user.tag} (${user.id})`
            : "Unknown user",
          inline: false
        },
        {
          name: "Details",
          value: details?.toString() || "None",
          inline: false
        }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });

  } catch (err) {
    // IMPORTANT: never crash bot because of logging
    console.error("❌ logAdminAction failed:", err);
  }
}

module.exports = { logAdminAction };