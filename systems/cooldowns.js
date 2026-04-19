const map = new Map();

const DEFAULT_COOLDOWN = 5000;

// =============================
// CLEANUP (runs every 30s)
// =============================
setInterval(() => {
  if (map.size === 0) return;

  const now = Date.now();

  for (const [key, expire] of map) {
    if (expire <= now) {
      map.delete(key);
    }
  }
}, 30000);

// =============================
// CHECK COOLDOWN
// =============================
function check(userId, cmd, cooldown = DEFAULT_COOLDOWN) {
  if (!userId || !cmd) return null;

  cooldown = Number(cooldown);
  if (!Number.isFinite(cooldown) || cooldown < 0) cooldown = DEFAULT_COOLDOWN;

  const key = `${userId}:${cmd}`;
  const now = Date.now();

  const expire = map.get(key);

  // still on cooldown
  if (expire && expire > now) {
    return expire - now;
  }

  // set new cooldown
  map.set(key, now + cooldown);
  return null;
}

module.exports = { check };