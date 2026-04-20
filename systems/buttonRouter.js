const blackjack = require("../games/blackjackManager");
const roulette = require("../games/rouletteManager");

// =============================
// BUTTON ROUTES
// =============================
const routes = {
  // 🃏 Blackjack
  hit: blackjack.hit,
  stand: blackjack.stand,

  // 🎡 Roulette (single entry point)
  r: roulette.handle
};

// =============================
// HANDLE BUTTON
// =============================
async function handleButton(i) {
  try {
    const parts = i.customId.split("_");
    const action = parts[0];

    // =============================
    // BLACKJACK
    // hit_userId
    // stand_userId
    // =============================
    if (action === "hit" || action === "stand") {
      const userId = parts[1];

      if (userId && userId !== i.user.id) {
        return i.reply({
          content: "❌ This is not your game",
          ephemeral: true
        });
      }

      const gameFn = routes[action];
      if (!gameFn) return false;

      return gameFn(i.user.id);
    }

    // =============================
    // ROULETTE
    // r_red_100
    // r_black_50
    // r_even_200
    // =============================
    if (action === "r") {
      const rouletteHandler = routes.r;

      if (!rouletteHandler) return false;

      return rouletteHandler(i);
    }

    return false;

  } catch (err) {
    console.error("BUTTON ROUTER ERROR:", err);

    if (!i.replied && !i.deferred) {
      return i.reply({
        content: "❌ Button system error",
        ephemeral: true
      });
    }
  }
}

module.exports = { handleButton };