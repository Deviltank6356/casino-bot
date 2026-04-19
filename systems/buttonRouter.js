const blackjack = require("../games/blackjackManager");

const routes = {
  hit: (i) => {
    const g = blackjack.hit(i.user.id);
    return { game: g, type: "hit" };
  },

  stand: (i) => {
    const g = blackjack.stand(i.user.id);
    return { game: g, type: "stand" };
  }
};

async function handleButton(i) {
  const route = routes[i.customId];
  if (!route) return false;

  const res = route(i);
  if (!res?.game) {
    return i.reply({
      content: "❌ No active game",
      ephemeral: true
    });
  }

  return res;
}

module.exports = { handleButton };