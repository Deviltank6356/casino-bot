client.on("interactionCreate", async (i) => {

  console.log("🔥 INTERACTION:", i.commandName || i.customId);

  // =============================
  // SLASH COMMANDS
  // =============================
  if (i.isChatInputCommand()) {

    try {
      console.log("➡️ COMMAND:", i.commandName);

      // =============================
      // SAFE LOGGING (DOES NOT CRASH BOT)
      // =============================
      try {
        if (typeof logCommand === "function") {
          logCommand(i);
        }
      } catch (e) {
        console.error("⚠️ logCommand failed:", e);
      }

      const cd = check(i.user.id, i.commandName);
      console.log("⏳ Cooldown:", cd);

      if (cd) {
        return i.reply({
          content: `⏳ Wait ${Math.ceil(cd / 1000)}s`,
          flags: 64
        });
      }

      const cmd = client.commands.get(i.commandName);

      if (!cmd) {
        console.log("❌ Command not found:", i.commandName);
        return i.reply({
          content: "❌ Command not found",
          flags: 64
        });
      }

      console.log("🚀 Executing:", i.commandName);

      await cmd.execute(i, client);

    } catch (err) {
      console.error("💥 COMMAND ERROR:", err);

      if (!i.replied) {
        return i.reply({
          content: "❌ Command crashed",
          flags: 64
        });
      }
    }
  }

  // =============================
  // BUTTONS
  // =============================
  if (i.isButton()) {

    console.log("🔘 BUTTON:", i.customId);

    const bj = require("./games/blackjackManager");

    const game = bj.getGame(i.user.id);
    if (!game) {
      return i.reply({
        content: "❌ No active blackjack game",
        flags: 64
      });
    }

    try {

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

    } catch (err) {
      console.error("💥 BUTTON ERROR:", err);

      return i.reply({
        content: "❌ Button error",
        flags: 64
      });
    }
  }
});