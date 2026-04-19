const blackjack = require("../games/blackjackManager");

// =============================
// BUTTON ROUTES
// =============================
const routes = {
  hit: blackjack.hit,
  stand: blackjack.stand
};

// =============================
// HANDLE BUTTON
// =============================
async function handleButton(i) {
  try {
    const [action, userId] = i.customId.split("_");

    // Ignore if not blackjack button
    if (!routes[action]) return false;

    // 🔒 SECURITY: only game owner can press buttons
    if (userId && userId !== i.user.id) {
      return i.reply({
        content: "❌ This is not your game",
        ephemeral: true
      });
    }

    const game = routes[action](i.user.id);

    if (!game) {
      return i.reply({
        content: "❌ No active game",
        ephemeral: true
      });
    }

    return game;

  } catch (err) {
    console.error("BUTTON ERROR:", err);

    if (!i.replied) {
      return i.reply({
        content: "❌ Button error",
        ephemeral: true
      });
    }
  }
}

module.exports = { handleButton };