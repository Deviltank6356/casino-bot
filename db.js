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

    spotifyLinked: 0,
    spotifyRefreshToken: null,
    lastChannelId: null,

    joinedAt: Date.now()
  };
}

// =============================
// TABLE
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

  spotifyLinked INTEGER DEFAULT 0,
  spotifyRefreshToken TEXT DEFAULT NULL,
  lastChannelId TEXT DEFAULT NULL,

  joinedAt INTEGER DEFAULT (strftime('%s','now') * 1000)
);
`).run();

// =============================
// SAFE PARSE
// =============================
function safeParse(v, fallback = {}) {
  try {
    if (!v) return fallback;
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

    started: raw.started === 1 ? 1 : 0,

    // 🔥 FIX: STRICT CHECK (prevents false negatives)
    spotifyLinked: raw.spotifyLinked === 1 ? 1 : 0,

    spotifyRefreshToken: raw.spotifyRefreshToken ?? null,
    lastChannelId: raw.lastChannelId ?? null,

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
        claims, streaks,
        started,
        spotifyLinked, spotifyRefreshToken, lastChannelId,
        joinedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      u.money,
      u.xp,
      u.level,
      u.bank,
      JSON.stringify(u.claims),
      JSON.stringify(u.streaks),
      u.started,
      u.spotifyLinked,
      u.spotifyRefreshToken,
      u.lastChannelId,
      u.joinedAt
    );

    return { id, ...u };
  }

  return normalize(row);
}

// =============================
// SAVE USER
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
      started = ?,
      spotifyLinked = ?,
      spotifyRefreshToken = ?,
      lastChannelId = ?
    WHERE id = ?
  `).run(
    u.money,
    u.xp,
    u.level,
    u.bank,
    JSON.stringify(u.claims),
    JSON.stringify(u.streaks),
    u.started,
    u.spotifyLinked,
    u.spotifyRefreshToken,
    u.lastChannelId,
    u.id
  );
}

module.exports = {
  db,
  getUser,
  saveUser
};