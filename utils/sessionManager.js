const sessions = new Map();

/**
 * Create session
 */
function createSession(userId, data = {}) {
  sessions.set(userId, {
    locked: false,
    lastUsed: Date.now(),
    ...data
  });
}

/**
 * Lock session (prevents spam / double click)
 */
function lockSession(userId) {
  const s = sessions.get(userId);
  if (!s) return false;

  if (s.locked) return false;

  s.locked = true;
  s.lastUsed = Date.now();
  return true;
}

/**
 * Unlock session
 */
function unlockSession(userId) {
  const s = sessions.get(userId);
  if (s) {
    s.locked = false;
    s.lastUsed = Date.now();
  }
}

/**
 * Get session
 */
function getSession(userId) {
  return sessions.get(userId);
}

/**
 * End session (call when game ends)
 */
function endSession(userId) {
  sessions.delete(userId);
}

/**
 * Lightweight cleanup (ONLY runs when Map grows)
 */
function cleanup() {
  if (sessions.size < 50) return;

  const now = Date.now();

  for (const [id, s] of sessions) {
    if (now - s.lastUsed > 10 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}

module.exports = {
  createSession,
  lockSession,
  unlockSession,
  getSession,
  endSession,
  cleanup
};