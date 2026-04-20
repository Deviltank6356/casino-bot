const blackjack = require("../games/blackjackManager");
const roulette = require("../games/rouletteManager");

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
    if (!i.customId) return false;

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
          flags: 64
        });
      }

      const gameFn = routes[action];
      if (!gameFn) return false;

      // 🔥 FIX: pass interaction, not userId
      return gameFn(i);
    }

    // =============================
    // ROULETTE
    // r_red_100 etc
    // =============================
    if (action === "r") {
      return roulette.handle(i);
    }

    return false;

  } catch (err) {
    console.error("BUTTON ROUTER ERROR:", err);

    try {
      if (i.replied || i.deferred) return;

      return i.reply({
        content: "❌ Button system error",
        flags: 64
      });
    } catch (e) {
      console.error("BUTTON FAILSAFE ERROR:", e);
    }
  }
}

module.exports = { handleButton };