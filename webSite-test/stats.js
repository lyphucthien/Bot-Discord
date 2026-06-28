const si = require("systeminformation");
const { ramHistory, pingHistory } = require("./cache");

let systemCache = { cpu: 0 };

function startStats(client) {
  let cpuRunning = false;

  setInterval(() => {
    if (cpuRunning) return;
    cpuRunning = true;

    si.currentLoad()
      .then(load => {
        systemCache.cpu = Math.round(load.currentLoad ?? 0);
      })
      .catch(() => {})
      .finally(() => cpuRunning = false);
  }, 5000);

  setInterval(() => {
    const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const ping = client.ws?.ping ?? 0;

    ramHistory.push(ram);
    pingHistory.push(ping);

    if (ramHistory.length > 60) ramHistory.shift();
    if (pingHistory.length > 60) pingHistory.shift();
  }, 1000);
}

module.exports = {
  startStats,
  systemCache
};