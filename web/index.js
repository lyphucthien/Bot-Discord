const express = require("express");
const si = require("systeminformation");
const http = require("http");
const path = require("path");
const https = require("https");
const { Server } = require("socket.io");
const compression = require("compression");

const packageJson = require("../package.json");
const expressVersion = require("express/package.json").version;
const discordVersion = require("discord.js").version;

const ramHistory = [];
const pingHistory = [];
const uptimeHistory = [];

let systemCache = { cpu: 0 };
let startTime = Date.now();
let longestUptime = 0;

const MAX_POINTS = 60;

module.exports = (client) => {

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    const visibleClients = new Set();

    app.use(compression());
    app.use(express.static(path.join(__dirname, "public")));

    const PORT = process.env.PORT || 10000;
    const URL = process.env.URL;

    function formatUptime(sec) {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;

        return `${d} ngày ${h} giờ ${m} phút ${s} giây`;
    }

    function getLevel(value, warn, danger) {
        if (value >= danger) return "danger";
        if (value >= warn) return "warning";
        return "good";
    }

    let cpuRunning = false;

    setInterval(() => {
        if (cpuRunning) return;
        cpuRunning = true;

        si.currentLoad()
            .then(load => {
                systemCache.cpu = Math.round(load.currentLoad ?? 0);
            })
            .catch(err => {
                console.error("❌ CPU monitoring error:", err.message);
                systemCache.cpu = 0;
            })
            .finally(() => {
                cpuRunning = false;
            });
    }, 5000);

    let statsCache = null;
    let BLOCK_TIME = 1 * 60 * 1000;
    let currentBlock = {
        start: Date.now(),
        online: true
    };

    setInterval(async () => {
        const now = Date.now();
        const currentUptime = Date.now() - startTime;

        if (currentUptime > longestUptime) { longestUptime = currentUptime; }

        const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const ping = client.ws?.ping ?? 0;
        const cpu = systemCache.cpu;
        const uptime = formatUptime(Math.floor(process.uptime()));
        const online = client.isReady();

        ramHistory.push(ram);
        if (ramHistory.length > MAX_POINTS)
            ramHistory.shift();

        pingHistory.push(ping);
        if (pingHistory.length > MAX_POINTS)
            pingHistory.shift();

        if (uptimeHistory.length > MAX_POINTS) uptimeHistory.shift();

        currentBlock.online = online;
        if (now - currentBlock.start >= BLOCK_TIME) {

            uptimeHistory.push({
                online: currentBlock.online,
                time: currentBlock.start
            });

            io.emit("uptimeBlock", currentBlock);

            currentBlock = {
                start: now,
                online: online
            };
        }

        const history = [
            ...uptimeHistory,
            currentBlock
        ];

        const total = history.length || 1;
        const onlineCount = history.filter(v => v.online).length;
        const onlinePercent = ((onlineCount / total) * 100).toFixed(2);

        let disconnectCount = 0;

        for (let i = 1; i < history.length; i++) {
            if (!history[i].online && history[i - 1].online) {
                disconnectCount++;
            }
        }

        statsCache = {
            ping,
            ram,
            cpu,
            guilds: client.guilds?.cache?.size || 0,
            uptime,

            botName: client.user?.username || "Discord Bot",
            online: client.isReady(),

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
            disconnectCount,
        };
    }, 1000);

    app.get("/ping", (req, res) => {
        res.json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: Date.now()
        });
    });

    io.on("connection", socket => {
        visibleClients.add(socket.id);

        try {
            socket.emit("history", {
                ram: ramHistory,
                ping: pingHistory,
                uptime: uptimeHistory
            });

            if (statsCache)
                socket.emit("stats", statsCache);
        } catch (err) {
            console.error("❌ Socket connection error:", err);
            socket.emit("error", { message: "Failed to load dashboard data" });
        }

        socket.on("visibility", (visible) => {
            if (visible) visibleClients.add(socket.id);
            else visibleClients.delete(socket.id);
        });

        socket.on("disconnect", () => {
            visibleClients.delete(socket.id);
        });
    });

    io.on("error", (error) => {
        console.error("❌ Socket.IO error:", error);
    });

    io.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
    });

    setInterval(() => {
        if (statsCache && visibleClients.size > 0)
            io.emit("stats", statsCache);
    }, 1000);

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 Web Server Chạy Ở Cổng ${PORT}`);
    });

    server.on("error", (err) => {
        console.error("❌ Server error:", err);
    });

    setInterval(() => {
        if (!URL) return;

        https.get(URL, { timeout: 5000 }, res => {
            if (res.statusCode >= 400) {
                console.log("⚠️ Ping fail:", res.statusCode);
            }
        }).on("error", err => {
            console.log("❌ Lỗi Duy Trì Kết Nối:", err.message);
        })
    }, 4 * 60 * 1000);

};
