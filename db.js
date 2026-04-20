const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

const db = new Database(path.join(__dirname, "casino.db"));

// ======================================================
// DEFAULT USER
// ======================================================
function defaultUser() {
  return {
    money: 0,
    xp: 0,
    level: 0,
    bank: 0,

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

// ======================================================
// TABLE
// ======================================================
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

// ======================================================
// SAFE JSON
// ======================================================
function parseJSON(v, fallback) {
  try {
    if (v === null || v === undefined || v === "") return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function stringifyJSON(v) {
  try {
    return JSON.stringify(v ?? {});
  } catch {
    return "{}";
  }
}

// ======================================================
// NORMALIZE DB ROW ONLY (NEVER USED ON SAVE INPUT)
// ======================================================
function fromRow(row) {
  const base = defaultUser();

  return {
    id: row.id,

    money: Number(row.money ?? 0),
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 0),
    bank: Number(row.bank ?? 0),

    claims: parseJSON(row.claims, {}),

    streaks: {
      daily: { ...base.streaks.daily, ...(parseJSON(row.streaks, {}).daily || {}) },
      weekly: { ...base.streaks.weekly, ...(parseJSON(row.streaks, {}).weekly || {}) },
      monthly: { ...base.streaks.monthly, ...(parseJSON(row.streaks, {}).monthly || {}) }
    },

    started: Number(row.started ?? 0) === 1 ? 1 : 0,
    spotifyLinked: Number(row.spotifyLinked ?? 0) === 1 ? 1 : 0,

    spotifyRefreshToken: row.spotifyRefreshToken ?? null,
    lastChannelId: row.lastChannelId ?? null,

    joinedAt: Number(row.joinedAt ?? Date.now())
  };
}

// ======================================================
// GET USER (SAFE)
// ======================================================
function getUser(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!row) {
    const u = defaultUser();

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
      stringifyJSON(u.claims),
      stringifyJSON(u.streaks),
      u.started,
      u.spotifyLinked,
      u.spotifyRefreshToken,
      u.lastChannelId,
      u.joinedAt
    );

    return { id, ...u };
  }

  return fromRow(row);
}

// ======================================================
// SAVE USER (FIXED — NO NORMALIZE REUSE)
// ======================================================
function saveUser(user) {
  if (!user?.id) throw new Error("saveUser: missing user.id");

  const base = defaultUser();

  const clean = {
    id: user.id,

    money: Number(user.money ?? 0),
    xp: Number(user.xp ?? 0),
    level: Number(user.level ?? 0),
    bank: Number(user.bank ?? 0),

    claims: user.claims ?? {},
    streaks: user.streaks ?? base.streaks,

    started: Number(user.started ?? 0),
    spotifyLinked: Number(user.spotifyLinked ?? 0),

    spotifyRefreshToken: user.spotifyRefreshToken ?? null,
    lastChannelId: user.lastChannelId ?? null,

    joinedAt: Number(user.joinedAt ?? Date.now())
  };

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
    clean.money,
    clean.xp,
    clean.level,
    clean.bank,
    stringifyJSON(clean.claims),
    stringifyJSON(clean.streaks),
    clean.started,
    clean.spotifyLinked,
    clean.spotifyRefreshToken,
    clean.lastChannelId,
    clean.id
  );
}

// ======================================================
// HELPERS
// ======================================================
function addMoney(id, amt) {
  db.prepare("UPDATE users SET money = money + ? WHERE id = ?").run(amt, id);
}

function addXP(id, amt) {
  db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(amt, id);
}

function addBank(id, amt) {
  db.prepare("UPDATE users SET bank = bank + ? WHERE id = ?").run(amt, id);
}

module.exports = {
  db,
  getUser,
  saveUser,
  addMoney,
  addXP,
  addBank
};