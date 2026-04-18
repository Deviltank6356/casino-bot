const fs = require("fs");

function logCommand(i) {
  fs.appendFileSync(
    "command-logs.jsonl",
    JSON.stringify({
      user: i.user.tag,
      command: i.commandName,
      time: new Date().toISOString()
    }) + "\n"
  );
}

module.exports = { logCommand };