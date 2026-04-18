const { getUser, saveUser } = require("../db");

const games = new Map();

const draw = () => Math.floor(Math.random() * 10) + 1;

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

function hit(id) {
  const g = games.get(id);
  if (!g || g.over) return null;

  g.player += draw();

  if (g.player > 21) {
    return end(id, "lose");
  }

  return g;
}

function stand(id) {
  const g = games.get(id);
  if (!g || g.over) return null;

  // 🧠 dealer AI (casino logic)
  while (g.dealer < 17) {
    const card = draw();

    // small realism: dealer sometimes holds on 16-17
    if (g.dealer >= 16 && Math.random() < 0.25) break;

    g.dealer += card;
  }

  if (g.dealer > 21) return end(id, "win");
  if (g.player > g.dealer) return end(id, "win");
  if (g.player === g.dealer) return end(id, "push");
  return end(id, "lose");
}

function end(id, result) {
  const g = games.get(id);
  if (!g || g.over) return null;

  const user = getUser(id);

  if (result === "win") user.money += g.bet;
  if (result === "lose") user.money -= g.bet;

  saveUser(user);

  g.result = result;
  g.over = true;

  setTimeout(() => games.delete(id), 15000);

  return g;
}

function getGame(id) {
  return games.get(id);
}

module.exports = {
  start,
  hit,
  stand,
  getGame
};