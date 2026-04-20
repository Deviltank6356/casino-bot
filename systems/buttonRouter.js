const blackjack = require("../games/blackjackManager");
const roulette = require("../games/rouletteManager");
const { checkButtonCooldown } = require("../utils/buttonCooldown");

async function handleButton(i) {
  try {
    const parts = i.customId.split(":");

    const action = parts[0];
    const type = parts[1];
    const bet = parts[2];
    const ownerId = parts[3];

    // =============================
    // 🛑 ANTI-SPAM (RUN FIRST)
    // =============================
    const cd = checkButtonCooldown(i.user.id, action, 2000);
    if (cd) {
      return i.reply({
        content: `⏳ Slow down! Wait ${Math.ceil(cd / 1000)}s`,
        ephemeral: true
      });
    }

    // =============================
    // 🔒 OWNER CHECK (GAME LOCK)
    // =============================
    if (ownerId && ownerId !== i.user.id) {
      return i.reply({
        content: "❌ This is not your game",
        ephemeral: true
      });
    }

    // =============================
    // 🃏 BLACKJACK
    // =============================
    if (action === "hit" || action === "stand") {
      const fn = blackjack[action];

      if (!fn) {
        return i.reply({
          content: "❌ Blackjack action missing",
          ephemeral: true
        });
      }

      // IMPORTANT: let handler fully control interaction
      return await fn(i);
    }

    // =============================
    // 🎡 ROULETTE
    // =============================
    if (action === "r") {
      return await roulette.handle(i);
    }

    // =============================
    // ❌ UNKNOWN BUTTON
    // =============================
    return i.reply({
      content: "❌ Unknown button",
      ephemeral: true
    });

  } catch (err) {
    console.error("BUTTON ERROR:", err);

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