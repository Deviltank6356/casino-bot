const { getUser, saveUser } = require("../../db");

function isRed(n) {
  return [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
}

function spin() {
  return Math.floor(Math.random() * 37);
}

async function handle(i) {
  const [_, type, bet] = i.customId.split("_");

  const user = getUser(i.user.id);
  const amount = Number(bet);

  if ((user.money ?? 0) < amount) {
    return i.update({
      content: "❌ Not enough money",
      components: []
    });
  }

  const result = spin();

  let win = false;
  let multiplier = 2;

  if (type === "red") win = result !== 0 && isRed(result);
  if (type === "black") win = result !== 0 && !isRed(result);
  if (type === "even") win = result !== 0 && result % 2 === 0;
  if (type === "odd") win = result % 2 === 1;
  if (type === "high") win = result >= 19;
  if (type === "low") win = result >= 1 && result <= 18;

  const change = win ? amount * multiplier : -amount;

  user.money = (user.money ?? 0) + change;
  saveUser(user);

  return i.update({
    content:
      `🎡 Result: ${result}\n` +
      `💰 Change: ${change >= 0 ? "+" : ""}${change}\n` +
      `${win ? "🟢 WIN" : "🔴 LOSE"}`,
    components: []
  });
}

module.exports = { handle };