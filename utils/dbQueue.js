const queue = [];
let running = false;

/**
 * Runs DB writes one at a time (prevents race conditions)
 */
async function runNext() {
  if (running) return;
  if (queue.length === 0) return;

  running = true;

  const job = queue.shift();

  try {
    await job.fn();
    job.resolve(true);
  } catch (err) {
    job.reject(err);
  }

  running = false;

  // next tick (prevents stack overflow)
  setImmediate(runNext);
}

/**
 * Adds DB transaction to queue
 * @returns Promise
 */
function runTransaction(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    runNext();
  });
}

module.exports = { runTransaction };