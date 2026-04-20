const { getUser, saveUser } = require("../db");

// =============================
// SAFE NUMBER NORMALIZER
// =============================
function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// =============================
// DEPOSIT (SAFE)
// =============================
function deposit(id, amount) {
  const u = getUser(id);

  amount = toNumber(amount);

  if (!u) return { error: "User not found" };
  if (amount <= 0) return { error: "Invalid amount" };

  // normalize balances
  u.money = toNumber(u.money);
  u.bank = toNumber(u.bank);

  // anti-exploit: prevent negative / overflow abuse
  if (amount > u.money) return { error: "Not enough cash" };

  const MAX_BANK = 1_000_000_000; // optional safety cap

  if (u.bank + amount > MAX_BANK) {
    return { error: "Bank limit reached" };
  }

  u.money -= amount;
  u.bank += amount;

  saveUser(u);

  return {
    ok: true,
    money: u.money,
    bank: u.bank
  };
}

// =============================
// WITHDRAW (SAFE)
// =============================
function withdraw(id, amount) {
  const u = getUser(id);

  amount = toNumber(amount);

  if (!u) return { error: "User not found" };
  if (amount <= 0) return { error: "Invalid amount" };

  // normalize balances
  u.money = toNumber(u.money);
  u.bank = toNumber(u.bank);

  // anti-exploit check
  if (amount > u.bank) return { error: "Not enough bank" };

  u.bank -= amount;
  u.money += amount;

  saveUser(u);

  return {
    ok: true,
    money: u.money,
    bank: u.bank
  };
}

module.exports = { deposit, withdraw };