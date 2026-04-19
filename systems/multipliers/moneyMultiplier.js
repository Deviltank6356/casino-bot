const boosts = [];

/*
boost = {
  id: string,
  value: number,
  expiresAt: number
}
*/

// =============================
// ADD BOOST
// =============================
function addMultiplier(value, durationMs) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  boosts.push({
    id,
    value,
    expiresAt: Date.now() + durationMs
  });

  return id;
}

// =============================
// REMOVE BOOST (by ID instead of value)
// =============================
function removeMultiplier(id) {
  const index = boosts.findIndex(b => b.id === id);
  if (index !== -1) boosts.splice(index, 1);
}

// =============================
// GET ACTIVE MULTIPLIER
// =============================
function getMultiplier() {
  const now = Date.now();

  // remove expired boosts safely
  for (let i = boosts.length - 1; i >= 0; i--) {
    if (boosts[i].expiresAt <= now) {
      boosts.splice(i, 1);
    }
  }

  // base multiplier
  let total = 1;

  for (const b of boosts) {
    total *= b.value;
  }

  return total;
}

// =============================
// OPTIONAL: DEBUG
// =============================
function getActiveBoosts() {
  return boosts;
}

module.exports = {
  addMultiplier,
  removeMultiplier,
  getMultiplier,
  getActiveBoosts
};