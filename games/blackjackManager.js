const { getUser, saveUser } = require("../db");

const games = new Map();

const draw = () => Math.floor(Math.random() * 10) + 1;

function start(userId, bet) {
  const user = getUser(userId);

  if (!user || user.money < bet) return null;

  // reserve money immediately (prevents dup betting)
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

function hit(userId) {
  const g = games.get(userId);
  if (!g || g.over) return null;

  g.player += draw();

  if (g.player > 21) {
    return end(userId, "lose");
  }

  return g;
}

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

function end(userId, result) {
  const g = games.get(userId);
  if (!g || g.over) return null;

  const user = getUser(userId);

  if (result === "win") user.money += g.bet * 2; // win returns bet + profit
  if (result === "push") user.money += g.bet;    // refund
  // lose = nothing (already deducted)

  saveUser(user);

  g.result = result;
  g.over = true;

  setTimeout(() => games.delete(userId), 10000);

  return g;
}

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