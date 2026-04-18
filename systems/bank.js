const { getUser, saveUser } = require("../db");

function deposit(id, amount) {
  const u = getUser(id);
  if (u.money < amount) return { error: "Not enough cash" };

  u.money -= amount;
  u.bank += amount;

  saveUser(u);
  return { ok: true };
}

function withdraw(id, amount) {
  const u = getUser(id);
  if (u.bank < amount) return { error: "Not enough bank" };

  u.bank -= amount;
  u.money += amount;

  saveUser(u);
  return { ok: true };
}

module.exports = { deposit, withdraw };