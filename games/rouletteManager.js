const { getUser, saveUser } = require("../../db");

function isRed(n) {
  return [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
}

function spin() {
  return Math.floor(Math.random() * 37);
}

async function handle(i) {
  try {
    if (!i.customId) return;

    const parts = i.customId.split("_");

    const type = parts[1];
    const bet = Number(parts[2]);

    // =============================
    // VALIDATION
    // =============================
    if (!type || !Number.isFinite(bet) || bet <= 0) {
      return i.update({
        content: "❌ Invalid roulette bet",
        components: []
      });
    }

    const user = getUser(i.user.id);

    if ((user.money ?? 0) < bet) {
      return i.update({
        content: "❌ Not enough money",
        components: []
      });
    }

    const result = spin();

    let win = false;
    const multiplier = 2;

    if (type === "red") win = result !== 0 && isRed(result);
    else if (type === "black") win = result !== 0 && !isRed(result);
    else if (type === "even") win = result !== 0 && result % 2 === 0;
    else if (type === "odd") win = result % 2 === 1;
    else if (type === "high") win = result >= 19 && result <= 36;
    else if (type === "low") win = result >= 1 && result <= 18;
    else {
      return i.update({
        content: "❌ Invalid bet type",
        components: []
      });
    }

    const change = win ? bet * multiplier : -bet;

    user.money = (user.money ?? 0) + change;
    saveUser(user);

    return i.update({
      content:
        `🎡 Result: ${result}\n` +
        `💰 Change: ${change >= 0 ? "+" : ""}${change}\n` +
        `${win ? "🟢 WIN" : "🔴 LOSE"}`,
      components: []
    });

  } catch (err) {
    console.error("ROULETTE MANAGER ERROR:", err);

    try {
      if (i.replied || i.deferred) return;

      return i.reply({
        content: "❌ Roulette error",
        flags: 64
      });
    } catch (e) {
      console.error("ROULETTE FAILSAFE ERROR:", e);
    }
  }
}

module.exports = { handle };