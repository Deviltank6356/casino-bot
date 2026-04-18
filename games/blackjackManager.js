const { getUser, saveUser } = require("../db");

const games = new Map();

const draw = () => Math.floor(Math.random() * 10) + 1;

function start(id, bet) {
  games.set(id, {
    player: draw() + draw(),
    dealer: draw() + draw(),
    bet,
    over: false
  });

  return games.get(id);
}

function hit(id) {
  const g = games.get(id);
  if (!g) return null;

  g.player += draw();

  if (g.player > 21) end(id, "lose");

  return g;
}

function stand(id) {
  const g = games.get(id);
  if (!g) return null;

  while (g.dealer < 17) g.dealer += draw();

  if (g.dealer > 21 || g.player > g.dealer) end(id, "win");
  else if (g.player === g.dealer) end(id, "push");
  else end(id, "lose");

  return g;
}

function end(id, r) {
  const g = games.get(id);
  const u = getUser(id);

  if (r === "win") u.money += g.bet;
  if (r === "lose") u.money -= g.bet;

  saveUser(u);

  g.result = r;
  g.over = true;

  setTimeout(() => games.delete(id), 10000);
}

module.exports = { start, hit, stand };