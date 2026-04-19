const Database = require("better-sqlite3");
const config = require("./config.json");

const db = new Database("casino.db");

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
  joinedAt INTEGER DEFAULT (strftime('%s','now'))
)
`).run();

// =============================
// SAFE JSON PARSE
// =============================
function safeParse(str, fallback = {}) {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return fallback;
  }
}

// =============================
// GET USER
// =============================
function getUser(id) {
  let user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!user) {
    const newUser = {
      id,
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
      joinedAt: Date.now()
    };

    db.prepare(`
      INSERT INTO users (id, money, xp, level, bank, claims, streaks, joinedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newUser.id,
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

  return {
    ...user,
    claims: safeParse(user.claims),
    streaks: safeParse(user.streaks, {
      daily: { count: 0, last: 0 },
      weekly: { count: 0, last: 0 },
      monthly: { count: 0, last: 0 }
    })
  };
}

// =============================
// SAVE USER
// =============================
function saveUser(u) {
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
    u.money ?? 0,
    u.xp ?? 0,
    u.level ?? 0,
    u.bank ?? 0,
    JSON.stringify(u.claims ?? {}),
    JSON.stringify(u.streaks ?? {}),
    u.id
  );
}

module.exports = { getUser, saveUser, db };