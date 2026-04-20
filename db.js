const Database = require("better-sqlite3");
const config = require("./config.json");
const path = require("path");

const db = new Database(path.join(__dirname, "casino.db"));

// =============================
// PERFORMANCE OPTIMIZATION
// =============================
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// =============================
// USERS TABLE
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
// SAFE JSON HELPERS
// =============================
const parse = (v, fallback = {}) => {
  try {
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const str = (v) => JSON.stringify(v ?? {});

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
// GET USER
// =============================
function getUser(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

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
    money: Number(row.money),
    xp: Number(row.xp),
    level: Number(row.level),
    bank: Number(row.bank),

    claims: parse(row.claims),
    streaks: parse(row.streaks),

    started: Number(row.started),
    spotifyLinked: Number(row.spotifyLinked),

    spotifyRefreshToken: row.spotifyRefreshToken,
    lastChannelId: row.lastChannelId,

    joinedAt: Number(row.joinedAt)
  };
}

// =============================
// 🔥 IMPROVED TRANSACTION QUEUE
// =============================
const queue = [];
let processing = false;

const MAX_QUEUE_SIZE = 500; // prevents RAM spike

function runTransaction(task) {
  return new Promise((resolve, reject) => {
    if (queue.length > MAX_QUEUE_SIZE) {
      return reject(new Error("DB queue overflow (too many writes)"));
    }

    queue.push({ task, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();

    // 🧠 safety timeout per transaction (prevents stuck queue)
    const timeout = setTimeout(() => {
      job.reject(new Error("DB transaction timeout"));
    }, 5000);

    try {
      const result = await job.task();
      clearTimeout(timeout);
      job.resolve(result);
    } catch (err) {
      clearTimeout(timeout);
      job.reject(err);
    }
  }

  processing = false;
}

// =============================
// SAVE USER (QUEUED + SAFE)
// =============================
function saveUser(u) {
  if (!u?.id) throw new Error("Missing user.id");

  const clean = {
    id: u.id,
    money: Number(u.money ?? 0),
    xp: Number(u.xp ?? 0),
    level: Number(u.level ?? 0),
    bank: Number(u.bank ?? 0),

    claims: u.claims ?? {},
    streaks: u.streaks ?? {},

    started: Number(u.started ?? 0),
    spotifyLinked: Number(u.spotifyLinked ?? 0),

    spotifyRefreshToken: u.spotifyRefreshToken ?? null,
    lastChannelId: u.lastChannelId ?? null,

    joinedAt: Number(u.joinedAt ?? Date.now())
  };

  return runTransaction(() => {
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
      str(clean.claims),
      str(clean.streaks),
      clean.started,
      clean.spotifyLinked,
      clean.spotifyRefreshToken,
      clean.lastChannelId,
      clean.id
    );
  });
}

// =============================
// EXPORTS
// =============================
module.exports = {
  db,
  getUser,
  saveUser,
  runTransaction
};