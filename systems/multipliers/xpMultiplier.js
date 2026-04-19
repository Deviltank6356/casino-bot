const boosts = [];

// =============================
// ADD BOOST (SAFE)
// =============================
function addMultiplier(value, durationMs) {
  if (!Number.isFinite(value) || value <= 0) return;

  boosts.push({
    value,
    expiresAt: Date.now() + durationMs
  });
}

// =============================
// REMOVE BOOST (ALL MATCHES)
// =============================
function removeMultiplier(value) {
  for (let i = boosts.length - 1; i >= 0; i--) {
    if (boosts[i].value === value) {
      boosts.splice(i, 1);
    }
  }
}

// =============================
// CLEAN EXPIRED BOOSTS
// =============================
function cleanup() {
  const now = Date.now();

  for (let i = boosts.length - 1; i >= 0; i--) {
    if (boosts[i].expiresAt <= now) {
      boosts.splice(i, 1);
    }
  }
}

// =============================
// GET MULTIPLIER
// =============================
function getMultiplier() {
  cleanup();

  let total = 1;

  for (const b of boosts) {
    if (Number.isFinite(b.value) && b.value > 0) {
      total *= b.value;
    }
  }

  return total;
}

module.exports = {
  addMultiplier,
  removeMultiplier,
  getMultiplier
};