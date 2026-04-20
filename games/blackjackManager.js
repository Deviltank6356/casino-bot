const { getUser, saveUser } = require("../db");

const games = new Map();

const draw = () => Math.floor(Math.random() * 10) + 1;

// =============================
// SCORE HAND
// =============================
function score(hand) {
  return hand.reduce((a, b) => a + b, 0);
}

// =============================
// START GAME
// =============================
function start(userId, bet) {
  const user = getUser(userId);

  if (!user || typeof user.money !== "number") return null;
  if (bet <= 0) return null;
  if (user.money < bet) return null;
  if (games.has(userId)) return null;

  user.money -= bet;
  saveUser(user);

  const game = {
    userId,
    bet,
    player: [draw(), draw()],
    dealer: [draw(), draw()],
    over: false,
    lock: false,
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
  if (!g || g.over || g.lock) return null;

  g.lock = true;

  g.player.push(draw());

  const pScore = score(g.player);

  if (pScore > 21) {
    g.lock = false;
    return end(userId, "lose");
  }

  g.lock = false;
  return g;
}

// =============================
// STAND
// =============================
function stand(userId) {
  const g = games.get(userId);
  if (!g || g.over || g.lock) return null;

  g.lock = true;

  let dScore = score(g.dealer);

  while (dScore < 17) {
    g.dealer.push(draw());
    dScore = score(g.dealer);
  }

  const pScore = score(g.player);

  let result = "lose";

  if (dScore > 21) result = "win";
  else if (pScore > dScore) result = "win";
  else if (pScore === dScore) result = "push";

  g.lock = false;
  return end(userId, result);
}

// =============================
// END GAME (SAFE ECONOMY)
// =============================
function end(userId, result) {
  const g = games.get(userId);
  if (!g || g.over) return null;

  const user = getUser(userId);

  if (result === "win") {
    user.money += g.bet * 2;
  } else if (result === "push") {
    user.money += g.bet;
  }

  saveUser(user);

  g.result = result;
  g.over = true;

  setTimeout(() => games.delete(userId), 10000);

  return g;
}

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