const { getUser } = require("../db");

/**
 * Checks if user has started the game
 * AND sends error reply automatically if not
 */
function requireStart(interaction) {
  try {
    const user = getUser(interaction.user.id);

    const started = Number(user?.started);

    if (started !== 1) {
      if (!interaction.replied && !interaction.deferred) {
        interaction.reply({
          content: "❌ You must run /start first!",
          ephemeral: true
        });
      }
      return false;
    }

    return true;

  } catch (err) {
    console.error("requireStart ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ Failed to verify start status",
        ephemeral: true
      });
    }

    return false;
  }
}

module.exports = { requireStart };