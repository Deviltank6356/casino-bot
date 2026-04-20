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
    .setName("removeadmin")
    .setDescription("Remove a bot admin")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to remove").setRequired(true)
    ),

  async execute(i) {
    const config = loadConfig();

    // OWNER ONLY
    if (i.user.id !== config.ownerId) {
      return i.reply({ content: "❌ Owner only", ephemeral: true });
    }

    const target = i.options.getUser("user");

    if (!Array.isArray(config.admins)) config.admins = [];

    if (!config.admins.includes(target.id)) {
      return i.reply({
        content: "⚠️ User is not an admin",
        ephemeral: true
      });
    }

    config.admins = config.admins.filter(id => id !== target.id);
    saveConfig(config);

    return i.reply({
      content: `✅ ${target.tag} removed from admins`,
      ephemeral: false
    });
  }
};