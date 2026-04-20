const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "..", "logs", "audit.log");

// ensure logs folder exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// =============================
// WRITE LOG (FAST + SAFE)
// =============================
function writeLog(entry) {
  const time = new Date().toISOString();

  const line =
    `[${time}] ` +
    `[${entry.type}] ` +
    `user=${entry.userId || "none"} ` +
    `${entry.action || ""} ` +
    `${entry.details || ""}\n`;

  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error("AUDIT LOG ERROR:", err);
  });
}

// =============================
// MAIN LOGGER WRAPPER
// =============================
function auditLog(type, data = {}) {
  writeLog({
    type,
    userId: data.userId,
    action: data.action,
    details: data.details
  });
}

module.exports = { auditLog };