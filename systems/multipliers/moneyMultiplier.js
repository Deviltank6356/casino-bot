const boosts = [];

/*
boost = {
  id: string,
  value: number,
  expiresAt: number
}
*/

// =============================
// ADD BOOST (SAFE + CONTROLLED)
// =============================
function addMultiplier(value, durationMs) {
  value = Number(value);
  durationMs = Number(durationMs);

  if (!Number.isFinite(value) || value <= 0) return null;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;

  // anti exploit cap (prevents x100 spam boosts)
  const MAX_SINGLE_BOOST = 10;
  if (value > MAX_SINGLE_BOOST) value = MAX_SINGLE_BOOST;

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  boosts.push({
    id,
    value,
    expiresAt: Date.now() + durationMs
  });

  return id;
}

// =============================
// REMOVE BOOST (by ID only)
// =============================
function removeMultiplier(id) {
  if (!id) return false;

  const index = boosts.findIndex(b => b.id === id);
  if (index === -1) return false;

  boosts.splice(index, 1);
  return true;
}

// =============================
// CLEANUP EXPIRED BOOSTS
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
// GET ACTIVE MULTIPLIER (SAFE)
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

  // safety cap (prevents economy breaking stacks)
  const MAX_TOTAL_MULTIPLIER = 25;

  return Math.min(total, MAX_TOTAL_MULTIPLIER);
}

// =============================
// DEBUG (SAFE COPY)
// =============================
function getActiveBoosts() {
  cleanup();
  return boosts.map(b => ({
    id: b.id,
    value: b.value,
    expiresAt: b.expiresAt
  }));
}

module.exports = {
  addMultiplier,
  removeMultiplier,
  getMultiplier,
  getActiveBoosts
};