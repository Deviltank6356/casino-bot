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

const STREAK_MULTIPLIER = {
  daily: 1.15,
  weekly: 1.25,
  monthly: 1.4
};

function claim(id, type) {
  const user = getUser(id);

  if (!user.claims) user.claims = {};
  if (!user.streaks) user.streaks = { daily: 0, weekly: 0, monthly: 0 };

  const now = Date.now();

  const lastClaim = user.claims[type] || 0;
  const timeLimit = TIMES[type];

  // =============================
  // COOLDOWN CHECK
  // =============================
  if (now - lastClaim < timeLimit) {
    return {
      error: `Already claimed. Try again later.`
    };
  }

  // =============================
  // STREAK LOGIC
  // =============================
  const missedCycle = now - lastClaim > timeLimit * 2;

  if (missedCycle) {
    user.streaks[type] = 1; // reset streak
  } else {
    user.streaks[type] = (user.streaks[type] || 0) + 1;
  }

  const streak = user.streaks[type];

  // =============================
  // REWARD CALCULATION
  // =============================
  const base = BASE_REWARDS[type];

  const multiplier = 1 + (streak * STREAK_MULTIPLIER[type] / 10);

  const reward = Math.floor(base * multiplier);

  user.money += reward;

  // update claim time
  user.claims[type] = now;

  saveUser(user);

  return {
    amount: reward,
    streak
  };
}

module.exports = { claim };