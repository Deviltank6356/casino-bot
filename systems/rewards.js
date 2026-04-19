const { getUser, saveUser } = require("../db");

const TIMES = {
  daily: 86400000,
  weekly: 604800000,
  monthly: 2592000000
};

const BASE_REWARDS = {
  daily: 1000,
  weekly: 7000,
  monthly: 30000
};

// safer streak scaling (caps growth)
const STREAK_BONUS = {
  daily: 0.05,
  weekly: 0.08,
  monthly: 0.1
};

// =============================
// CLAIM REWARD
// =============================
function claim(id, type) {
  const user = getUser(id);

  if (!TIMES[type]) {
    return { error: "Invalid reward type" };
  }

  if (!user.claims) user.claims = {};
  if (!user.streaks) user.streaks = {};

  user.streaks[type] = Number(user.streaks[type] || 0);

  const now = Date.now();
  const lastClaim = Number(user.claims[type] || 0);
  const cooldown = TIMES[type];

  // =============================
  // COOLDOWN CHECK
  // =============================
  if (now - lastClaim < cooldown) {
    const remaining = cooldown - (now - lastClaim);

    return {
      error: `⏳ Already claimed. Try again in ${Math.ceil(remaining / 60000)} min.`
    };
  }

  // =============================
  // STREAK LOGIC
  // =============================
  const missed = now - lastClaim > cooldown * 2;

  if (missed) {
    user.streaks[type] = 1;
  } else {
    user.streaks[type] += 1;
  }

  const streak = user.streaks[type];

  // =============================
  // REWARD CALCULATION (CONTROLLED GROWTH)
  // =============================
  const base = BASE_REWARDS[type];

  const multiplier = 1 + Math.min(streak * STREAK_BONUS[type], 2); 
  // cap bonus at +200%

  const reward = Math.floor(base * multiplier);

  user.money = Number(user.money || 0) + reward;

  // update claim time
  user.claims[type] = now;

  saveUser(user);

  return {
    amount: reward,
    streak
  };
}

module.exports = { claim };