const Database = require("better-sqlite3");
const config = require("./config.json");

const db = new Database("casino.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  money INTEGER,
  xp INTEGER,
  level INTEGER,
  bank INTEGER,
  joinedAt INTEGER
)
`).run();

function getUser(id) {
  let user = db.prepare("SELECT * FROM users WHERE id=?").get(id);

  if (!user) {
    user = {
      id,
      money: config.startingMoney,
      xp: 0,
      level: 0,
      bank: 0,
      joinedAt: Date.now()
    };

    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)")
      .run(user.id, user.money, user.xp, user.level, user.bank, user.joinedAt);
  }

  return user;
}

function saveUser(u) {
  db.prepare(`
    UPDATE users SET money=?, xp=?, level=?, bank=? WHERE id=?
  `).run(u.money, u.xp, u.level, u.bank, u.id);
}

module.exports = { getUser, saveUser };