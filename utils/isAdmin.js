const config = require("../config.json");

module.exports = (id) => {
  // always allow owner
  if (id === config.ownerId) return true;

  // fallback safe check
  if (!Array.isArray(config.admins)) return false;

  return config.admins.includes(id);
};