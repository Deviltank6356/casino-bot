const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// DEFAULT USER
// =============================
function createDefaultUser() {
  return {
    money: config.startingMoney ?? 0,
    xp: config.startingXP ?? 0,
    level: config.startingLevel ?? 0,
    bank: config.startingBank ?? 0,

    claims: {},
    streaks: {
      daily: { count: 0, last: 0 },
      weekly: { count: 0, last: 0 },
      monthly: { count: 0, last: 0 }
    },

    started: 0,
    joinedAt: Date.now()
  };
}

// =============================
// TABLE (SAFE)
// =============================
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  money INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  bank INTEGER DEFAULT 0,
  claims TEXT DEFAULT '{}',
  streaks TEXT DEFAULT '{}',
  started INTEGER DEFAULT 0,
  joinedAt INTEGER
);
`).run();

// 🔥 FIX: auto-migrate missing column (IMPORTANT)
try {
  db.prepare(`ALTER TABLE users ADD COLUMN started INTEGER DEFAULT 0`).run();
} catch (_) {}

// =============================
// SAFE PARSE (ROBUST)
// =============================
function safeParse(v, fallback = {}) {
  try {
    if (!v || v === "null" || v === "undefined" || v === "") return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

// =============================
// NORMALIZE (FIXED)
// =============================
function normalize(raw) {
  const streaks = safeParse(raw.streaks);

  return {
    id: raw.id,

    money: Number(raw.money) || 0,
    xp: Number(raw.xp) || 0,
    level: Number(raw.level) || 0,
    bank: Number(raw.bank) || 0,

    claims: safeParse(raw.claims),

    streaks: {
      daily: { count: 0, last: 0, ...(streaks.daily || {}) },
      weekly: { count: 0, last: 0, ...(streaks.weekly || {}) },
      monthly: { count: 0, last: 0, ...(streaks.monthly || {}) }
    },

    // 🔥 HARD LOCK
    started: raw.started === 1 ? 1 : 0,

    joinedAt: Number(raw.joinedAt) || Date.now()
  };
}

// =============================
// GET USER
// =============================
function getUser(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!row) {
    const u = createDefaultUser();

    db.prepare(`
      INSERT INTO users (
        id, money, xp, level, bank,
        claims, streaks, started, joinedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      u.money,
      u.xp,
      u.level,
      u.bank,
      JSON.stringify(u.claims),
      JSON.stringify(u.streaks),
      u.started,
      u.joinedAt
    );

    return { id, ...u };
  }

  return normalize(row);
}

// =============================
// SAVE USER (SAFE + CONSISTENT)
// =============================
function saveUser(user) {
  const u = normalize(user);

  db.prepare(`
    UPDATE users SET
      money = ?,
      xp = ?,
      level = ?,
      bank = ?,
      claims = ?,
      streaks = ?,
      started = ?
    WHERE id = ?
  `).run(
    u.money,
    u.xp,
    u.level,
    u.bank,
    JSON.stringify(u.claims),
    JSON.stringify(u.streaks),
    u.started,
    u.id
  );
}

module.exports = {
  db,
  getUser,
  saveUser
};