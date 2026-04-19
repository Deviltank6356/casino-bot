const { getUser, saveUser } = require("../db");

const games = new Map();

const draw = () => Math.floor(Math.random() * 10) + 1;

// =============================
// START GAME
// =============================
function start(userId, bet) {
  const user = getUser(userId);

  if (!user || typeof user.money !== "number") return null;
  if (bet <= 0) return null;
  if (user.money < bet) return null;
  if (games.has(userId)) return null; // prevent double game

  // reserve bet safely
  user.money -= bet;
  saveUser(user);

  const game = {
    userId,
    bet,
    player: draw() + draw(),
    dealer: draw() + draw(),
    over: false,
    result: null
  };

  games.set(userId, game);
  return game;
}

// =============================
// HIT
// =============================
function hit(userId) {
  const g = games.get(userId);
  if (!g || g.over) return null;

  g.player += draw();

  if (g.player > 21) {
    return end(userId, "lose");
  }

  return g;
}

// =============================
// STAND
// =============================
function stand(userId) {
  const g = games.get(userId);
  if (!g || g.over) return null;

  while (g.dealer < 17) {
    g.dealer += draw();
  }

  if (g.dealer > 21) return end(userId, "win");
  if (g.player > g.dealer) return end(userId, "win");
  if (g.player === g.dealer) return end(userId, "push");
  return end(userId, "lose");
}

// =============================
// END GAME (FIXED ECONOMY)
// =============================
function end(userId, result) {
  const g = games.get(userId);
  if (!g || g.over) return null;

  const user = getUser(userId);

  // IMPORTANT:
  // bet was already deducted in start()

  if (result === "win") {
    user.money += g.bet * 2; // return bet + winnings
  }

  if (result === "push") {
    user.money += g.bet; // refund
  }

  // lose = nothing

  saveUser(user);

  g.result = result;
  g.over = true;

  games.set(userId, g);

  setTimeout(() => games.delete(userId), 10000);

  return g;
}

// =============================
// HELPERS
// =============================
function getGame(userId) {
  return games.get(userId);
}

function endGame(userId) {
  games.delete(userId);
}

module.exports = {
  start,
  hit,
  stand,
  getGame,
  endGame
};