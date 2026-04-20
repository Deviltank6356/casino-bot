const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// CREATE TABLE
// =============================
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,

  money INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  bank INTEGER NOT NULL DEFAULT 0,

  claims TEXT NOT NULL DEFAULT '{}',
  streaks TEXT NOT NULL DEFAULT '{}',

  started INTEGER NOT NULL DEFAULT 0,

  spotifyLinked INTEGER NOT NULL DEFAULT 0,
  spotifyRefreshToken TEXT DEFAULT NULL,
  lastChannelId TEXT DEFAULT NULL,

  joinedAt INTEGER NOT NULL
);
`).run();

// =============================
// DEFAULT USER
// =============================
function defaultUser(id) {
  return {
    id,

    money: Number(config.startingMoney ?? 0),
    xp: Number(config.startingXP ?? 0),
    level: Number(config.startingLevel ?? 0),
    bank: Number(config.startingBank ?? 0),

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
// HELPERS
// =============================
const parse = (v, f = {}) => {
  try {
    return v ? JSON.parse(v) : f;
  } catch {
    return f;
  }
};

const str = (v) => JSON.stringify(v ?? {});

// =============================
// GET USER
// =============================
function getUser(id) {
  let row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!row) {
    const u = defaultUser(id);

    db.prepare(`
      INSERT INTO users (
        id, money, xp, level, bank,
        claims, streaks,
        started,
        spotifyLinked, spotifyRefreshToken, lastChannelId,
        joinedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      u.id,
      u.money,
      u.xp,
      u.level,
      u.bank,
      str(u.claims),
      str(u.streaks),
      u.started,
      u.spotifyLinked,
      u.spotifyRefreshToken,
      u.lastChannelId,
      u.joinedAt
    );

    return u;
  }

  return {
    id: row.id,
    money: row.money,
    xp: row.xp,
    level: row.level,
    bank: row.bank,

    claims: parse(row.claims, {}),
    streaks: parse(row.streaks, {}),

    started: row.started,
    spotifyLinked: row.spotifyLinked,

    spotifyRefreshToken: row.spotifyRefreshToken,
    lastChannelId: row.lastChannelId,

    joinedAt: row.joinedAt
  };
}

// =============================
// SAVE USER (STRICT DB WRITE)
// =============================
function saveUser(u) {
  if (!u?.id) throw new Error("Missing user.id");

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
    u.money ?? 0,
    u.xp ?? 0,
    u.level ?? 0,
    u.bank ?? 0,
    str(u.claims),
    str(u.streaks),
    u.started ?? 0,
    u.spotifyLinked ?? 0,
    u.spotifyRefreshToken ?? null,
    u.lastChannelId ?? null,
    u.id
  );
}

module.exports = {
  db,
  getUser,
  saveUser
};