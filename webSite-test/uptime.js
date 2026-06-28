const { uptimeHistory } = require("./cache");

let currentBlock = {
  start: Date.now(),
  online: true
};

function startUptime(io, client) {

  setInterval(() => {
    const now = Date.now();
    const online = client.isReady();

    currentBlock.online = online;

    if (now - currentBlock.start >= 60 * 1000) {

      uptimeHistory.push({
        online: currentBlock.online,
        time: currentBlock.start
      });

      io.emit("uptimeBlock", currentBlock);

      currentBlock = {
        start: now,
        online
      };
    }

  }, 1000);
}

module.exports = { startUptime };