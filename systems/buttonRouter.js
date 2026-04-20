const blackjack = require("../games/blackjackManager");
const roulette = require("../games/rouletteManager");

const routes = {
  hit: blackjack.hit,
  stand: blackjack.stand,
  r: roulette.handle
};

async function handleButton(i) {
  try {
    const parts = i.customId.split("_");
    const action = parts[0];

    // =============================
    // BLACKJACK FIX
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

      // 🔥 IMPORTANT FIX: await + pass interaction
      return await gameFn(i);
    }

    // =============================
    // ROULETTE
    // =============================
    if (action === "r") {
      return await routes.r(i);
    }

    return false;

  } catch (err) {
    console.error("BUTTON ROUTER ERROR:", err);

    try {
      if (!i.replied && !i.deferred) {
        return i.reply({
          content: "❌ Button system error",
          ephemeral: true
        });
      }
    } catch {}
  }
}

module.exports = { handleButton };