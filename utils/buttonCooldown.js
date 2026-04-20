const cooldowns = new Map();

/**
 * Prevents button spam per user per action
 * @returns {number|null} remaining ms if on cooldown
 */
function checkButtonCooldown(userId, action, cooldown = 2000) {
  const key = `${userId}:${action}`;
  const now = Date.now();

  const expire = cooldowns.get(key);

  // still on cooldown
  if (expire && expire > now) {
    return expire - now;
  }

  // set cooldown
  cooldowns.set(key, now + cooldown);

  return null;
}

// auto cleanup (prevents memory leaks)
setInterval(() => {
  const now = Date.now();

  for (const [key, expire] of cooldowns) {
    if (expire <= now) cooldowns.delete(key);
  }
}, 30000);

module.exports = { checkButtonCooldown };