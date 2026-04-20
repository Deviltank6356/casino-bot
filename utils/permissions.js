const config = require("../config.json");
const { logAction } = require("../db"); // IMPORTANT

function getUserRole(userId) {
  if (userId === config.ownerId) return "owner";
  if (config.adminIds?.includes(userId)) return "admin";
  return "user";
}

function canBan(targetId, executorId) {
  const targetRole = getUserRole(targetId);
  const executorRole = getUserRole(executorId);

  // OWNER IMMUNE
  if (targetRole === "owner") {
    logAction({
      type: "BAN_BLOCKED_OWNER",
      actorId: executorId,
      targetId,
      success: 0
    });
    return false;
  }

  // ADMIN RESTRICTIONS
  if (executorRole === "admin") {
    const allowed = targetRole === "user";

    if (!allowed) {
      logAction({
        type: "BAN_BLOCKED_ADMIN_RULE",
        actorId: executorId,
        targetId,
        success: 0
      });
    }

    return allowed;
  }

  // OWNER CAN BAN ANYONE
  if (executorRole === "owner") return true;

  return false;
}

module.exports = {
  getUserRole,
  canBan
};