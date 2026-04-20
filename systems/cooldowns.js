const map = new Map();

const DEFAULT_COOLDOWN = 10000; // 10 seconds

// =============================
// CHECK COOLDOWN
// returns remaining ms OR null
// =============================
function check(userId, cmd, cooldown = DEFAULT_COOLDOWN) {
  if (!userId || !cmd) return null;

  const key = `${userId}:${cmd}`;
  const now = Date.now();

  const finalCooldown =
    Number.isFinite(cooldown) && cooldown > 0
      ? cooldown
      : DEFAULT_COOLDOWN;

  const expire = map.get(key);

  // still on cooldown
  if (expire && expire > now) {
    return expire - now;
  }

  // set cooldown
  map.set(key, now + finalCooldown);

  return null;
}

// =============================
// 🧹 CLEANUP (MEMORY SAFE)
// =============================
setInterval(() => {
  const now = Date.now();

  // faster iteration + safe deletion
  for (const [key, expire] of map.entries()) {
    if (expire <= now) {
      map.delete(key);
    }
  }
}, 60000); // 1 minute is optimal (no need for 30s spam)

// =============================
module.exports = { check };