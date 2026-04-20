const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../../config.json");

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addadmin")
    .setDescription("Add a bot admin")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to add").setRequired(true)
    ),

  async execute(i) {
    const config = loadConfig();

    // OWNER ONLY
    if (i.user.id !== config.ownerId) {
      return i.reply({ content: "❌ Owner only", ephemeral: true });
    }

    const target = i.options.getUser("user");

    if (!config.admins) config.admins = [];

    if (config.admins.includes(target.id)) {
      return i.reply({
        content: "⚠️ User is already an admin",
        ephemeral: true
      });
    }

    config.admins.push(target.id);
    saveConfig(config);

    return i.reply({
      content: `✅ ${target.tag} is now an admin`,
      ephemeral: false
    });
  }
};