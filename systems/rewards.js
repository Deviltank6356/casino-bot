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

const STREAK_BONUS = {
  daily: 0.05,
  weekly: 0.08,
  monthly: 0.1
};

// =============================
// CLAIM REWARD (SAFE VERSION)
// =============================
function claim(id, type) {
  const user = getUser(id);

  // =============================
  // VALIDATION (ANTI EXPLOIT)
  // =============================
  if (!user || typeof user !== "object") {
    return { error: "User not found" };
  }

  if (!TIMES[type] || !BASE_REWARDS[type]) {
    return { error: "Invalid reward type" };
  }

  // ensure safe defaults
  user.claims ??= {};
  user.streaks ??= {};

  user.claims[type] = Number(user.claims[type] || 0);
  user.streaks[type] = Math.max(0, Number(user.streaks[type] || 0));

  const now = Date.now();
  const lastClaim = user.claims[type];
  const cooldown = TIMES[type];

  // =============================
  // COOLDOWN CHECK
  // =============================
  if (lastClaim && now - lastClaim < cooldown) {
    const remaining = cooldown - (now - lastClaim);

    return {
      error: `⏳ Already claimed. Try again in ${Math.ceil(remaining / 60000)} min.`
    };
  }

  // =============================
  // STREAK LOGIC (ANTI ABUSE)
  // =============================
  const missed = !lastClaim || now - lastClaim > cooldown * 2;

  if (missed) {
    user.streaks[type] = 1;
  } else {
    user.streaks[type] = Math.min(user.streaks[type] + 1, 1000); // 🔒 cap streak
  }

  const streak = user.streaks[type];

  // =============================
  // REWARD CALCULATION (SAFE MATH)
  // =============================
  const base = BASE_REWARDS[type];

  const bonus = Math.min(streak * STREAK_BONUS[type], 2); // max +200%
  const multiplier = 1 + bonus;

  const reward = Math.floor(Math.max(0, base * multiplier));

  // =============================
  // APPLY MONEY (SAFE GUARD)
  // =============================
  user.money = Math.max(0, Number(user.money || 0) + reward);

  // update claim timestamp
  user.claims[type] = now;

  saveUser(user);

  return {
    amount: reward,
    streak
  };
}

module.exports = { claim };