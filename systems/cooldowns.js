const map = new Map();

// default cooldown (5s)
const DEFAULT_COOLDOWN = 5000;

// =============================
// CLEANUP INTERVAL (every 30s)
// =============================
setInterval(() => {
  const now = Date.now();

  for (const [key, expire] of map.entries()) {
    if (now > expire) {
      map.delete(key);
    }
  }
}, 30000);

// =============================
// CHECK COOLDOWN
// =============================
function check(userId, cmd, cooldown = DEFAULT_COOLDOWN) {
  const key = `${userId}:${cmd}`;
  const now = Date.now();

  const expire = map.get(key);

  if (expire && now < expire) {
    return expire - now; // still on cooldown
  }

  map.set(key, now + cooldown);
  return null;
}

module.exports = { check };