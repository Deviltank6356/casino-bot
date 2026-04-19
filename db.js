const Database = require("better-sqlite3");
const config = require("./config.json");

const db = new Database("casino.db");

// =============================
// DEFAULTS
// =============================
const DEFAULT_STREAKS = {
  daily: { count: 0, last: 0 },
  weekly: { count: 0, last: 0 },
  monthly: { count: 0, last: 0 }
};

const DEFAULT_USER = () => ({
  money: config.startingMoney ?? 0,
  xp: config.startingXP ?? 0,
  level: config.startingLevel ?? 0,
  bank: config.startingBank ?? 0,
  claims: {},
  streaks: structuredClone(DEFAULT_STREAKS),
  joinedAt: Date.now()
});

// =============================
// TABLE SETUP (SAFE MIGRATION)
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
  joinedAt INTEGER DEFAULT (strftime('%s','now') * 1000)
)
`).run();

// 🔥 AUTO-FIX OLD DATABASES (IMPORTANT)
try {
  db.prepare(`ALTER TABLE users ADD COLUMN claims TEXT DEFAULT '{}'`).run();
} catch (_) {}

try {
  db.prepare(`ALTER TABLE users ADD COLUMN streaks TEXT DEFAULT '{}'`).run();
} catch (_) {}

// =============================
// SAFE JSON
// =============================
function safeParse(input, fallback = {}) {
  try {
    return input ? JSON.parse(input) : fallback;
  } catch {
    return fallback;
  }
}

// =============================
// NORMALIZE USER
// =============================
function normalizeUser(user) {
  const streaks = safeParse(user.streaks, {});

  return {
    id: user.id,
    money: user.money ?? 0,
    xp: user.xp ?? 0,
    level: user.level ?? 0,
    bank: user.bank ?? 0,
    claims: safeParse(user.claims, {}),
    streaks: {
      daily: { ...DEFAULT_STREAKS.daily, ...(streaks.daily || {}) },
      weekly: { ...DEFAULT_STREAKS.weekly, ...(streaks.weekly || {}) },
      monthly: { ...DEFAULT_STREAKS.monthly, ...(streaks.monthly || {}) }
    },
    joinedAt: user.joinedAt ?? Date.now()
  };
}

// =============================
// GET USER
// =============================
function getUser(id) {
  let user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!user) {
    const newUser = { id, ...DEFAULT_USER() };

    db.prepare(`
      INSERT INTO users (id, money, xp, level, bank, claims, streaks, joinedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      newUser.money,
      newUser.xp,
      newUser.level,
      newUser.bank,
      JSON.stringify(newUser.claims),
      JSON.stringify(newUser.streaks),
      newUser.joinedAt
    );

    return newUser;
  }

  return normalizeUser(user);
}

// =============================
// SAVE USER
// =============================
function saveUser(user) {
  const u = normalizeUser(user);

  db.prepare(`
    UPDATE users
    SET money = ?,
        xp = ?,
        level = ?,
        bank = ?,
        claims = ?,
        streaks = ?
    WHERE id = ?
  `).run(
    u.money,
    u.xp,
    u.level,
    u.bank,
    JSON.stringify(u.claims),
    JSON.stringify(u.streaks),
    u.id
  );
}

module.exports = {
  db,
  getUser,
  saveUser
};