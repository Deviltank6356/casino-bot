const map = new Map();
const COOLDOWN = 5000;

function check(userId, cmd) {
  const key = userId + ":" + cmd;
  const now = Date.now();

  if (map.has(key)) {
    const expire = map.get(key);
    if (now < expire) return expire - now;
  }

  map.set(key, now + COOLDOWN);
  return null;
}

module.exports = { check };