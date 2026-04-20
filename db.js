const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

const db = new Database(path.join(__dirname, "casino.db"));

// ======================================================
// DEFAULT USER (single source of truth)
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
function safeJSONParse(value, fallback) {
  try {
    if (value === null || value === undefined || value === "") return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeJSONStringify(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

// ======================================================
// NORMALIZE DB ROW → CLEAN OBJECT
// ======================================================
function normalize(row) {
  const base = defaultUser();

  if (!row) return base;

  return {
    id: row.id,

    money: Number(row.money ?? 0),
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 0),
    bank: Number(row.bank ?? 0),

    claims: safeJSONParse(row.claims, {}),
    streaks: {
      daily: { ...base.streaks.daily, ...(safeJSONParse(row.streaks, {}).daily || {}) },
      weekly: { ...base.streaks.weekly, ...(safeJSONParse(row.streaks, {}).weekly || {}) },
      monthly: { ...base.streaks.monthly, ...(safeJSONParse(row.streaks, {}).monthly || {}) }
    },

    started: Number(row.started ?? 0) === 1 ? 1 : 0,
    spotifyLinked: Number(row.spotifyLinked ?? 0) === 1 ? 1 : 0,

    spotifyRefreshToken: row.spotifyRefreshToken ?? null,
    lastChannelId: row.lastChannelId ?? null,

    joinedAt: Number(row.joinedAt ?? Date.now())
  };
}

// ======================================================
// GET USER (ALWAYS SAFE)
// ======================================================
function getUser(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!row) {
    const user = defaultUser();

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
      user.money,
      user.xp,
      user.level,
      user.bank,
      safeJSONStringify(user.claims),
      safeJSONStringify(user.streaks),
      user.started,
      user.spotifyLinked,
      user.spotifyRefreshToken,
      user.lastChannelId,
      user.joinedAt
    );

    return { id, ...user };
  }

  return normalize(row);
}

// ======================================================
// SAVE USER (ANTI-DESYNC CORE)
// ======================================================
function saveUser(user) {
  if (!user?.id) throw new Error("saveUser: missing user.id");

  const clean = normalize(user);

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
    safeJSONStringify(clean.claims),
    safeJSONStringify(clean.streaks),
    clean.started,
    clean.spotifyLinked,
    clean.spotifyRefreshToken,
    clean.lastChannelId,
    clean.id
  );
}

// ======================================================
// OPTIONAL: ATOMIC INCREMENT HELPERS (prevents race bugs)
// ======================================================
function addMoney(id, amount) {
  db.prepare("UPDATE users SET money = money + ? WHERE id = ?").run(amount, id);
}

function addXP(id, amount) {
  db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(amount, id);
}

function addBank(id, amount) {
  db.prepare("UPDATE users SET bank = bank + ? WHERE id = ?").run(amount, id);
}

module.exports = {
  db,
  getUser,
  saveUser,
  addMoney,
  addXP,
  addBank
};