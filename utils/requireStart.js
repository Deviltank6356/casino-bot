const { getUser } = require("../db");

/**
 * Checks if a user has started the game
 * @returns {boolean}
 */
function requireStart(interaction) {
  try {
    const user = getUser(interaction.user.id);

    if (!user) return false;

    return user.started === 1 || user.started === true;

  } catch (err) {
    console.error("requireStart ERROR:", err);
    return false;
  }
}

module.exports = { requireStart };