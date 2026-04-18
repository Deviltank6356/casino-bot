const { getUser, saveUser } = require("../db");

function claim(id, type) {
  const user = getUser(id);

  user.claims = user.claims || {};
  const now = Date.now();

  const times = {
    daily: 86400000,
    weekly: 604800000,
    monthly: 2592000000
  };

  if (now - (user.claims[type] || 0) < times[type]) {
    return { error: "Already claimed" };
  }

  const rewards = {
    daily: 1000,
    weekly: 7000,
    monthly: 30000
  };

  user.money += rewards[type];
  user.claims[type] = now;

  saveUser(user);

  return { amount: rewards[type] };
}

module.exports = { claim };