const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

// =============================
// DB (ABSOLUTE PATH = SAFE WITH PM2)
// =============================
const db = new Database(path.join(__dirname, "casino.db"));

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
// TABLE SETUP (SAFE + CONSISTENT)
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
);
`).run();

// =============================
// SAFE JSON PARSER (FIXED)
// =============================
function safeParse(input, fallback = {}) {
  try {
    if (input === null || input === undefined) return fallback;
    if (input === "" || input === "null" || input === "undefined") return fallback;
    return JSON.parse(String(input));
  } catch {
    return fallback;
  }
}

// =============================
// NORMALIZE USER (SAFE CASTING)
// =============================
function normalizeUser(raw) {
  const streaks = safeParse(raw.streaks, {});

  return {
    id: raw.id,
    money: Number(raw.money ?? 0),
    xp: Number(raw.xp ?? 0),
    level: Number(raw.level ?? 0),
    bank: Number(raw.bank ?? 0),
    claims: safeParse(raw.claims, {}),
    streaks: {
      daily: { ...DEFAULT_STREAKS.daily, ...(streaks.daily || {}) },
      weekly: { ...DEFAULT_STREAKS.weekly, ...(streaks.weekly || {}) },
      monthly: { ...DEFAULT_STREAKS.monthly, ...(streaks.monthly || {}) }
    },
    joinedAt: Number(raw.joinedAt ?? Date.now())
  };
}

// =============================
// GET USER (AUTO CREATE)
// =============================
function getUser(id) {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

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

  } catch (err) {
    console.error("🔥 DB getUser error:", err);
    throw err;
  }
}

// =============================
// SAVE USER
// =============================
function saveUser(user) {
  try {
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

  } catch (err) {
    console.error("🔥 DB saveUser error:", err);
    throw err;
  }
}

module.exports = {
  db,
  getUser,
  saveUser
};