const config = require("../config.json");

module.exports = (id) => config.admins.includes(id);