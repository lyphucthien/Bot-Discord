const { createApp } = require("./app");
const { startStats, systemCache } = require("./stats");
const { startUptime } = require("./uptime");
const { ramHistory, pingHistory, uptimeHistory } = require("./cache");
const { formatUptime, getLevel } = require("./utils");

const packageJson = require("../package.json");
const expressVersion = require("express/package.json").version;
const discordVersion = require("discord.js").version;

module.exports = (client) => {

  const { server, io } = createApp();

  const PORT = process.env.PORT || 3000;
  const URL = "https://my-discord-bot-mfu0.onrender.com";

  startStats(client);
  startUptime(io, client);

  let statsCache = null;

  let longestUptime = 0;
  const startTime = Date.now();

  let BLOCK_TIME = 60 * 1000;
  let currentBlock = { start: Date.now(), online: true };

  setInterval(() => {

    const now = Date.now();
    const uptimeSec = Math.floor(process.uptime());

    if (Date.now() - startTime > longestUptime) {
      longestUptime = Date.now() - startTime;
    }

    const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const ping = client.ws?.ping ?? 0;
    const cpu = systemCache.cpu;
    const uptime = formatUptime(uptimeSec);
    const online = client.isReady();

    currentBlock.online = online;

    if (now - currentBlock.start >= BLOCK_TIME) {
      uptimeHistory.push(currentBlock);
      io.emit("uptimeBlock", currentBlock);

      currentBlock = { start: now, online };
    }

    const history = [...uptimeHistory, currentBlock];
    const onlineCount = history.filter(v => v.online).length;
    const onlinePercent = ((onlineCount / history.length) * 100).toFixed(2);

    let disconnectCount = 0;
    for (let i = 1; i < history.length; i++) {
      if (!history[i].online && history[i - 1].online) disconnectCount++;
    }

    statsCache = {
      ping,
      ram,
      cpu,
      guilds: client.guilds?.cache?.size || 0,
      uptime,

      version: packageJson.version,
      node: process.version,
      discordjs: discordVersion,
      express: expressVersion,
      host: "Hề Dung",

      longestUptime: formatUptime(Math.floor(longestUptime / 1000)),
      time: new Date().toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh"
      }),

      status: {
        ping: getLevel(ping, 100, 200),
        ram: getLevel(ram, 300, 400),
        cpu: getLevel(cpu, 70, 90)
      },

      onlinePercent,
      disconnectCount
    };

  }, 1000);

  io.on("connection", socket => {
    socket.emit("history", {
      ram: ramHistory,
      ping: pingHistory,
      uptime: uptimeHistory
    });

    if (statsCache) socket.emit("stats", statsCache);
  });

  setInterval(() => {
    if (statsCache) io.emit("stats", statsCache);
  }, 1000);

server.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Web Server Chạy Ở Cổng", PORT);
});

  const https = require("https");

  setInterval(() => {
    https.get(URL, res => {
      if (res.statusCode >= 400) {
        console.log("⚠️ Ping fail:", res.statusCode);
      }
    }).on("error", err => {
      console.log("❌ Lỗi Duy Trì Kết Nối:", err.message);
    });
  }, 4 * 60 * 1000);

};
