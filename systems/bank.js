const { getUser, saveUser } = require("../db");

// =============================
// SAFE NUMBER NORMALIZER
// =============================
function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// =============================
// DEPOSIT
// =============================
function deposit(id, amount) {
  const u = getUser(id);
  amount = toNumber(amount);

  if (!u) return { error: "User not found" };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Invalid amount" };

  u.money = toNumber(u.money);
  u.bank = toNumber(u.bank);

  if (u.money < amount) return { error: "Not enough cash" };

  u.money -= amount;
  u.bank += amount;

  saveUser(u);
  return { ok: true, bank: u.bank, money: u.money };
}

// =============================
// WITHDRAW
// =============================
function withdraw(id, amount) {
  const u = getUser(id);
  amount = toNumber(amount);

  if (!u) return { error: "User not found" };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Invalid amount" };

  u.money = toNumber(u.money);
  u.bank = toNumber(u.bank);

  if (u.bank < amount) return { error: "Not enough bank" };

  u.bank -= amount;
  u.money += amount;

  saveUser(u);
  return { ok: true, bank: u.bank, money: u.money };
}

module.exports = { deposit, withdraw };