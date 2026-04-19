const bj = require("./games/blackjackManager");

client.on("interactionCreate", async (i) => {
  try {
    console.log("🔥 INTERACTION:", i.commandName || i.customId);

    // =============================
    // SLASH COMMANDS
    // =============================
    if (i.isChatInputCommand()) {
      console.log("➡️ COMMAND:", i.commandName);

      // SAFE LOGGING
      try {
        if (typeof logCommand === "function") {
          logCommand(i);
        }
      } catch (e) {
        console.error("⚠️ logCommand failed:", e);
      }

      const cd = check(i.user.id, i.commandName);

      if (cd) {
        return i.reply({
          content: `⏳ Wait ${Math.ceil(cd / 1000)}s`,
          ephemeral: true
        });
      }

      const cmd = client.commands.get(i.commandName);

      if (!cmd) {
        return i.reply({
          content: "❌ Command not found",
          ephemeral: true
        });
      }

      console.log("🚀 Executing:", i.commandName);

      await cmd.execute(i, client);
    }

    // =============================
    // BUTTONS
    // =============================
    if (i.isButton()) {
      console.log("🔘 BUTTON:", i.customId);

      const game = bj.getGame(i.user.id);

      if (!game) {
        return i.reply({
          content: "❌ No active blackjack game",
          ephemeral: true
        });
      }

      if (i.customId === "hit") {
        const g = bj.hit(i.user.id);
        if (!g) return;

        if (g.over) {
          return i.update({
            content: `💥 BUST!\n🧑 ${g.player} vs 🎩 ${g.dealer}\n🏁 YOU LOSE`,
            components: []
          });
        }

        return i.update({
          content: `🧑 ${g.player} vs 🎩 ${g.dealer}`,
          components: i.message.components
        });
      }

      if (i.customId === "stand") {
        const g = bj.stand(i.user.id);

        let result = "LOSE";
        if (g.result === "win") result = "WIN";
        if (g.result === "push") result = "PUSH";

        return i.update({
          content:
            `🏁 FINAL RESULT\n` +
            `🧑 ${g.player}\n` +
            `🎩 ${g.dealer}\n` +
            `💰 RESULT: ${result}`,
          components: []
        });
      }
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);

    if (!i.replied && !i.deferred) {
      return i.reply({
        content: "❌ Something went wrong",
        ephemeral: true
      });
    }
  }
});