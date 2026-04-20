const boosts = [];

// =============================
// ADD BOOST (SAFE + CONTROLLED)
// =============================
function addMultiplier(value, durationMs) {
  value = Number(value);
  durationMs = Number(durationMs);

  // validation
  if (!Number.isFinite(value) || value <= 0) return false;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return false;

  // anti exploit cap (prevents x1000 spam abuse)
  const MAX_MULTIPLIER = 10;
  if (value > MAX_MULTIPLIER) value = MAX_MULTIPLIER;

  boosts.push({
    value,
    expiresAt: Date.now() + durationMs
  });

  return true;
}

// =============================
// REMOVE BOOST (SAFE)
// =============================
function removeMultiplier(value) {
  value = Number(value);

  if (!Number.isFinite(value)) return;

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
// GET MULTIPLIER (SAFE STACK LIMIT)
// =============================
function getMultiplier() {
  cleanup();

  let total = 1;

  for (const b of boosts) {
    const val = Number(b.value);

    if (Number.isFinite(val) && val > 0) {
      total *= val;
    }
  }

  // safety cap (prevents economy breaking multipliers)
  const MAX_TOTAL_MULTIPLIER = 25;

  return Math.min(total, MAX_TOTAL_MULTIPLIER);
}

module.exports = {
  addMultiplier,
  removeMultiplier,
  getMultiplier
};