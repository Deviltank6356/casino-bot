const boosts = [];

function addMultiplier(value, durationMs) {
  boosts.push({
    value,
    expiresAt: Date.now() + durationMs
  });
}

function removeMultiplier(value) {
  const index = boosts.findIndex(b => b.value === value);
  if (index !== -1) boosts.splice(index, 1);
}

function getMultiplier() {
  const now = Date.now();

  for (let i = boosts.length - 1; i >= 0; i--) {
    if (boosts[i].expiresAt <= now) boosts.splice(i, 1);
  }

  let total = 1;

  for (const b of boosts) {
    total *= b.value;
  }

  return total;
}

module.exports = {
  addMultiplier,
  removeMultiplier,
  getMultiplier
};