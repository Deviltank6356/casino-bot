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

  const cd = Number(cooldown);
  const finalCooldown = Number.isFinite(cd) && cd > 0 ? cd : DEFAULT_COOLDOWN;

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
// CLEANUP (optimized)
// =============================
setInterval(() => {
  const now = Date.now();

  for (const [key, expire] of map) {
    if (expire <= now) {
      map.delete(key);
    }
  }
}, 60000); // every 60s is enough (30s is unnecessary spam)

module.exports = { check };