const express = require("express");
const { db } = require("../db");

const router = express.Router();

// 🏆 GLOBAL LEADERBOARD
router.get("/", (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const rows = db.prepare(`
      SELECT id, money, xp, level
      FROM users
      ORDER BY money DESC
      LIMIT ?
    `).all(limit);

    const leaderboard = rows.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      money: u.money,
      xp: u.xp,
      level: u.level
    }));

    return res.json({
      success: true,
      leaderboard
    });

  } catch (err) {
    console.error("Leaderboard API error:", err);

    return res.status(500).json({
      success: false,
      leaderboard: []
    });
  }
});

module.exports = router;