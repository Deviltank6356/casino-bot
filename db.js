const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// DEFAULT DATA
// =============================
const DEFAULT_STREAKS = {
  daily: { count: 0, last: 0 },
  weekly: { count: 0, last: 0 },
  monthly: { count: 0, last: 0 }
};

function createDefaultUser() {
  return {
    money: config.startingMoney ?? 0,
    xp: config.startingXP ?? 0,
    level: config.startingLevel ?? 0,
    bank: config.startingBank ?? 0,
    claims: {},
    streaks: structuredClone(DEFAULT_STREAKS),
    started: 0,
    joinedAt: Date.now()
  };
}

// =============================
// TABLE SETUP
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
  joinedAt INTEGER DEFAULT (strftime('%s','now') * 1000)
)
`).run();

// =============================
// SAFE JSON
// =============================
function safeParse(value, fallback = {}) {
  try {
    if (value === null || value === undefined) return fallback;
    if (value === "" || value === "null" || value === "undefined") return fallback;
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

// =============================
// NORMALIZE USER
// =============================
function normalizeUser(raw) {
  const streaks = safeParse(raw.streaks);

  return {
    id: raw.id,
    money: Number(raw.money) || 0,
    xp: Number(raw.xp) || 0,
    level: Number(raw.level) || 0,
    bank: Number(raw.bank) || 0,

    claims: safeParse(raw.claims),
    streaks: {
      daily: { ...DEFAULT_STREAKS.daily, ...(streaks.daily || {}) },
      weekly: { ...DEFAULT_STREAKS.weekly, ...(streaks.weekly || {}) },
      monthly: { ...DEFAULT_STREAKS.monthly, ...(streaks.monthly || {}) }
    },

    started: Number(raw.started) || 0,
    joinedAt: Number(raw.joinedAt) || Date.now()
  };
}

// =============================
// GET USER
// =============================
function getUser(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!row) {
    const user = createDefaultUser();

    db.prepare(`
      INSERT INTO users (
        id, money, xp, level, bank,
        claims, streaks, started, joinedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.money,
      user.xp,
      user.level,
      user.bank,
      JSON.stringify(user.claims),
      JSON.stringify(user.streaks),
      user.started,
      user.joinedAt
    );

    return { id, ...user };
  }

  return normalizeUser(row);
}

// =============================
// SAVE USER
// =============================
function saveUser(user) {
  const u = normalizeUser(user);

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