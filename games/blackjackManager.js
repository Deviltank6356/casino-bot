const { getUser, saveUser } = require("../db");

const games = new Map();

// =============================
// CARD SYSTEM (more realistic)
// =============================
const draw = () => Math.floor(Math.random() * 11) + 1;

// =============================
function start(id, bet) {
  const game = {
    player: draw() + draw(),
    dealer: draw() + draw(),
    bet,
    over: false,
    result: null
  };

  games.set(id, game);
  return game;
}

// =============================
function hit(id) {
  const g = games.get(id);
  if (!g || g.over) return null;

  g.player += draw();

  if (g.player > 21) {
    return end(id, "lose");
  }

  return g;
}

// =============================
function stand(id) {
  const g = games.get(id);
  if (!g || g.over) return null;

  // =============================
  // DEALER RULES (standard casino logic)
  // =============================
  while (g.dealer < 17) {
    g.dealer += draw();

    if (g.dealer > 21) break;
  }

  // =============================
  // RESULT LOGIC
  // =============================
  if (g.player > 21) return end(id, "lose");
  if (g.dealer > 21) return end(id, "win");

  if (g.player > g.dealer) return end(id, "win");
  if (g.player < g.dealer) return end(id, "lose");

  return end(id, "push");
}

// =============================
// END GAME (SAFE + CORRECT PAYOUTS)
// =============================
function end(id, result) {
  const g = games.get(id);
  if (!g || g.over) return null;

  const user = getUser(id);

  // =============================
  // PAYOUT SYSTEM
  // =============================
  if (result === "win") {
    user.money += g.bet;
  }

  if (result === "lose") {
    user.money -= g.bet;
  }

  if (result === "push") {
    // refund bet (no change)
  }

  saveUser(user);

  g.result = result;
  g.over = true;

  // cleanup
  setTimeout(() => games.delete(id), 15000);

  return g;
}

// =============================
function getGame(id) {
  return games.get(id);
}

module.exports = {
  start,
  hit,
  stand,
  getGame
};