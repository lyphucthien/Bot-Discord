const express = require("express");
const si = require("systeminformation");
const http = require("http");
const { Server } = require("socket.io");

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

    const PORT = process.env.PORT || 3000;
    const URL = "https://my-discord-bot-mfu0.onrender.com";

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
            .catch(console.error)
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
        if (!client?.isReady?.()) return;
        if (!client?.ws) return;

        const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const ping = client.ws?.ping ?? 0;
        const cpu = systemCache.cpu;
        const uptime = formatUptime(Math.floor(process.uptime()));
        const online = client.isReady();

        ramHistory.push(ram);
        pingHistory.push(ping);

        if (uptimeHistory.length > MAX_POINTS) uptimeHistory.shift();
        if (ramHistory.length > MAX_POINTS) ramHistory.shift();
        if (pingHistory.length > MAX_POINTS) pingHistory.shift();

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

        const total = uptimeHistory.length || 1;

        const onlineCount = uptimeHistory.reduce((acc, v) => {
            return acc + (v.online ? 1 : 0);
        }, 0);

        const onlinePercent = ((onlineCount / total) * 100).toFixed(2);

        let disconnectCount = 0;

        for (let i = 1; i < uptimeHistory.length; i++) {
            if (!uptimeHistory[i].online && uptimeHistory[i - 1].online) {
                disconnectCount++;
            }
        }

        statsCache = {
            ping,
            ram,
            cpu,
            guilds: client.guilds.cache.size,
            uptime,

            version: packageJson.version,
            node: process.version,
            discordjs: discordVersion,
            express: expressVersion,
            host: "Render",

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

    app.get("/", (req, res) => {

        const online = client.isReady();

        const statusText = online ? "ONLINE" : "OFFLINE";

        res.send(`
    <html>
    <head>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <title>🤖 Bot Dashboard - Xem Trạng Thái Bot Discord Của Bot Lâm Đồng</title>

        <style>
.top-bar{
    width:100%;
    max-width:920px;

    margin: 0 auto 5px;

    display:grid;
    grid-template-columns:repeat(5,1fr);

    background:var(--card);
    backdrop-filter:blur(15px);

    border:1px solid var(--border);
    border-radius:20px;

    overflow:hidden;
}

.top-item{
    padding:18px 12px;
    text-align:center;
}

.top-item:not(:last-child){
    border-right:1px solid var(--border);
}

.top-title{
    font-size:13px;
    opacity:.7;
    margin-bottom: 8px;
}

.top-value{
    font-size:20px;
    font-weight:bold;
}

.page{
    width:100%;
    max-width:1700px;

    display:flex;
    flex-direction:column;
    gap: 8px;
}

.block {
    animation: pop .3s ease;
}

@keyframes pop {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.modal{

    display:none;

    position:fixed;

    inset:0;

    justify-content:center;
    align-items:center;

    background:rgba(0,0,0,.65);

    backdrop-filter:blur(8px);

    z-index:9999;

}

.modal.show{

    display:flex;

    animation:fade .25s;

}

@keyframes fade{

    from{
        opacity:0;
        transform:scale(.95);
    }

    to{
        opacity:1;
        transform:scale(1);
    }

}

.modal-content{

    width:700px;
    max-width:95%;

    background:var(--card);

    border:1px solid var(--border);

    border-radius:20px;

    padding:25px;

}

.modal-header{

    display:flex;
    justify-content:space-between;
    align-items:center;

    margin-bottom:20px;

}

#closeModal{

    cursor:pointer;

    font-size:30px;

}

#closeModal:hover{

    color:#ef4444;

}

#uptimeBlocks{

    display:grid;

    grid-template-columns:repeat(30,18px);

    gap:5px;

    margin-bottom:25px;

}

.block{

    width:18px;
    height:18px;

    border-radius:5px;

}

.onlineBlock{

    background:#22c55e;

}

.offlineBlock{

    background:#ef4444;

}

.uptime-info{

    display:flex;

    flex-direction:column;

    gap:12px;

}

.info-row{

    display:flex;

    justify-content:space-between;

    background:var(--stat);

    padding:12px 16px;

    border-radius:10px;

}

:root {
    --bg: #0f172a;
    --bg2: #1e293b;
    --card: rgba(255,255,255,.08);
    --text: #ffffff;
    --border: rgba(255,255,255,.15);
    --stat: rgba(255,255,255,.05);

    --primary: #3b82f6;
    --success: #22c55e;
    --danger: #ef4444;

    --chart-grid: rgba(255,255,255,0.05);
}

[data-theme="light"] {
    --bg: #f8fafc;
    --bg2: #e2e8f0;
    --card: rgba(255,255,255,.9);
    --text: #111827;
    --border: #d1d5db;
    --stat: #f3f4f6;

    --primary: #2563eb;
    --success: #16a34a;
    --danger: #dc2626;

    --chart-grid: rgba(0,0,0,0.08);
}

html, body {
    height: 100vh;
    overflow: hidden;
}

body {
    margin:0;
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:flex-start;

    padding: 15px 40px 40px;

    background: linear-gradient(-45deg, var(--bg), var(--bg2), var(--bg), var(--bg2));

    background-size: 400% 400%;
    animation: gradient 15s ease infinite;

    color: var(--text);
    font-family: Arial;

    transition: background .4s ease, color .3s ease;
}

@keyframes gradient{
    0%{background-position:0% 50%;}
    50%{background-position:100% 50%;}
    100%{background-position:0% 50%;}
}

.card{
    width:620px;
    flex-shrink:0;

    background: var(--card);
    backdrop-filter:blur(15px);
    border:1px solid var(--border);
    border-radius:20px;
    padding:30px;
    box-shadow:0 0 30px rgba(0,0,0,.4);

    transition:.25s;
}

.card:hover{
    transform:translateY(-5px);
}

.dashboard {
    width:100%;

    display:flex;
    justify-content:center;
    align-items:center;
    gap: 35px;
    padding: 20px;
}

.chart-card{
    width:320px;
    height:600px;

    flex-shrink:0;

    background:var(--card);
    backdrop-filter:blur(15px);
    border:1px solid var(--border);
    border-radius:20px;
    padding:20px;

    transition:.25s;
}

.chart-card:hover{
    transform:translateY(-5px);
}

.chart-card h2{
    margin-top:0;
    text-align:center;
}

.chart-card canvas{
    width:100%!important;
    height:520px!important;
}

@media(max-width:1400px){

.dashboard{
    flex-direction:column;
}

.card{
    width:90%;
}

.chart-card {
    width:90%;
    height:320px;
}

.chart-card canvas{
    height:250px!important;
}

}

.status{
    font-size:30px;
    font-weight:bold;
    margin:20px 0;
}

.dot{
    width:18px;
    height:18px;
    border-radius:50%;
    display:inline-block;
    margin-right:10px;
    position:relative;
}

.online{
    background:#22c55e;
    box-shadow:0 0 10px #22c55e;
}

.online::after{
    content:"";
    position:absolute;
    top:50%;
    left:50%;
    width:18px;
    height:18px;
    border-radius:50%;
    transform:translate(-50%,-50%);
    background:#22c55e;
    animation:pulse 1.5s infinite;
    opacity:.6;
}

.offline{
    background:#ef4444;
    box-shadow:0 0 10px #ef4444;
}

.offline::after{
    content:"";
    position:absolute;
    top:50%;
    left:50%;
    width:18px;
    height:18px;
    border-radius:50%;
    transform:translate(-50%,-50%);
    background:#ef4444;
    animation:pulse 1.5s infinite;
    opacity:.5;
}

@keyframes pulse{
    0%{transform:translate(-50%,-50%) scale(1);opacity:.6;}
    70%{transform:translate(-50%,-50%) scale(2.8);opacity:0;}
    100%{opacity:0;}
}

.stat {
    transition: all .25s ease;
    cursor: pointer;
    display:flex;
    justify-content:space-between;

    padding:12px;
    margin:10px 0;

    background:var(--stat);
    border-radius:10px;
}

.stat:hover {
    transform: translateY(-3px) scale(1.02);
    background: var(--card);
    filter: brightness(1.15);
    box-shadow: 0 10px 25px rgba(0,0,0,.25);
}
 
#themeBtn{
    position:fixed;
    top:20px;
    right:20px;

    padding:12px 20px;

    border:none;
    border-radius:14px;

    cursor:pointer;

    font-size:15px;
    font-weight:bold;

    background:linear-gradient(135deg,#2563eb,#60a5fa);
    color:white;

    box-shadow:0 10px 25px rgba(37,99,235,.4);

    transition:all .25s ease;
}

#themeBtn:hover{
    transform:translateY(-4px) scale(1.08);
    box-shadow:0 15px 35px rgba(37,99,235,.6);
    filter:brightness(1.1);
}

#themeBtn:active{
    transform:scale(0.95);
}
.loading-spinner{
    width:18px;
    height:18px;

    display:inline-block;

    border:3px solid rgba(255,255,255,.2);
    border-top:3px solid #3b82f6;

    border-radius:50%;

    animation:spin .8s linear infinite;
}

[data-theme="light"] .loading-spinner{
    border:3px solid rgba(0,0,0,.15);
    border-top:3px solid #2563eb;
}

@keyframes spin{
    from{
        transform:rotate(0deg);
    }
    to{
        transform:rotate(360deg);
    }
}

.good {
    color: #22c55e;
    font-weight: bold;
    transition: 0.3s;
}

.warning {
    color: #f59e0b;
    font-weight: bold;
    transition: 0.3s;
}

.danger {
    color: #ef4444;
    font-weight: bold;
    animation: blink 1s infinite;
}

.shake {
    animation: shake 0.3s infinite;
}

@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    50% { transform: translateX(2px); }
    75% { transform: translateX(-2px); }
    100% { transform: translateX(0); }
}

.glow {
    animation: glow 1.2s infinite alternate;
}

@keyframes glow {
    0% {
        box-shadow: 0 0 5px #22c55e;
    }
    100% {
        box-shadow: 0 0 20px #ef4444;
    }
}

.pulse {
    animation: cpuPulse 1s infinite;
}

@keyframes cpuPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
}

@keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}
        </style>
    </head>
    <body>
        
        <button id="themeBtn">🌙 Dark</button>
        <div class="page">

        <div class="top-bar">

            <div class="top-item">
                <div class="top-title">🤖 Phiên Bản</div>
                <div class="top-value" id="version"></div>
            </div>

            <div class="top-item">
                <div class="top-title">🟢 Node</div>
                <div class="top-value" id="node"></div>
            </div>

            <div class="top-item">
                <div class="top-title">📦 discord.js</div>
                <div class="top-value" id="discordjs"></div>
            </div>

            <div class="top-item">
                <div class="top-title">⚡ Express</div>
                <div class="top-value" id="express"></div>
            </div>

            <div class="top-item">
                <div class="top-title">🌐 Host</div>
                <div class="top-value" id="host"></div>
            </div>

        </div>

        <div class="dashboard">

            <div class="left-charts">

                <div class="chart-card small">
                    <h2>⚡ Ping</h2>
                    <canvas id="pingChart"></canvas>
                </div>

            </div>
        
        <div class="card">

            <h1>
                🤖 ${client.user ? client.user.username : "Bot Lâm Đồng"}
            </h1>

            <div class="status">
               <span class="dot ${online ? "online" : "offline"}"></span>
                 ${statusText}
            </div>

            <div class="stat">
             <span>⚡ Ping</span>
                <span id="ping" class="loading-spinner"></span>
            </div>

            <div class="stat">
             <span>💾 RAM</span>
                <span id="ram" class="loading-spinner"></span>
            </div>

            <div class="stat">
                <span>🖥 CPU</span>
                <span id="cpu" class="loading-spinner"></span>
            </div>

            <div class="stat">
             <span>🏠 Servers</span>
                <span id="guilds">${online ? client.guilds.cache.size : 0}</span>
            </div>

            <div class="stat">
             <span>📅 Time</span>
                <span id="time" class="loading-spinner"></span>
            </div>

            <div class="stat" id="uptimeStat">
                <span>🕒 Uptime</span>
                <span id="uptime" class="loading-spinner"></span>
            </div>

            <hr style="border:none;height:1px;background:rgba(255, 255, 255, 0.13);margin:20px 0;">
            <div style="opacity:.7">
             💻 Created By Lý Phúc Thiện
             
            </div>
        </div>

        <div class="chart-card">
            <h2>💾 RAM</h2>
            <canvas id="ramChart"></canvas>
        </div>

    </div>
        
            <script src="/socket.io/socket.io.js"></script>

            <script>
            const socket = io();

            let pingChart;
            let ramChart;

            let pingData = [];
            let ramData = [];

            pingChart = new Chart(document.getElementById("pingChart"), {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34,197,94,.15)",
                        fill: true,
                        tension: .35,

                        pointRadius(ctx) {
                            const i = ctx.dataIndex;
                            const d = ctx.dataset.data;

                            if (i === 0) return 0;

                            return d[i] !== d[i - 1] ? 4 : 0;
                        },

                        pointHoverRadius: 6,
                        pointHitRadius: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            ramChart = new Chart(document.getElementById("ramChart"), {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59,130,246,.15)",
                        fill: true,
                        tension: .35,

                        pointRadius(ctx) {
                            const i = ctx.dataIndex;
                            const d = ctx.dataset.data;

                            if (i === 0) return 0;

                            return d[i] !== d[i - 1] ? 4 : 0;
                        },

                        pointHoverRadius: 6,
                        pointHitRadius: 15
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            socket.on("uptimeBlock", (v) => {
                const blocks = document.getElementById("uptimeBlocks");
                if (!blocks) return;

                const div = document.createElement("div");

                div.className = "block " + (v.online ? "onlineBlock" : "offlineBlock");

                const date = new Date(v.time);

                div.title =
                    (v.online ? "Online" : "Offline") +
                    " • " +
                    date.toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh"
                    });

                blocks.appendChild(div);
            });

            socket.on("history", data => {

                pingData = data.ping || [];
                ramData = data.ram || [];

                pingChart.data.labels = pingData.map((_, i) => i);
                pingChart.data.datasets[0].data = pingData;
                pingChart.update();

                ramChart.data.labels = ramData.map((_, i) => i);
                ramChart.data.datasets[0].data = ramData;
                ramChart.update();

                const blocks=document.getElementById("uptimeBlocks");

                if (!blocks) return;

                blocks.innerHTML="";

                (data.uptime || []).forEach(v => {
                    const div = document.createElement("div");

                    const isOnline = v.online;

                    div.className = "block " + (isOnline ? "onlineBlock" : "offlineBlock");

                    const date = new Date(v.time);

                    const formatted =
                        date.toLocaleString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        });

                    div.title = (isOnline ? "Online" : "Offline") + " • " + formatted;

                    blocks.appendChild(div);
                });
            });
            
            socket.on("stats", (data) => {

                const ping = document.getElementById("ping");
                const ram = document.getElementById("ram");
                const cpu = document.getElementById("cpu");
                const time = document.getElementById("time");
                const uptime = document.getElementById("uptime");

                ping.classList.remove("good", "warning", "danger", "shake");
                ram.classList.remove("good", "warning", "danger", "glow");
                cpu.classList.remove("good", "warning", "danger", "pulse");

                ping.classList.remove("loading-spinner");
                ram.classList.remove("loading-spinner");
                cpu.classList.remove("loading-spinner");
                time.classList.remove("loading-spinner");
                uptime.classList.remove("loading-spinner");

                ping.innerText = data.ping + " ms";
                ram.innerText = data.ram + " MB";
                cpu.innerText = data.cpu + " %";
                time.innerText = data.time;
                uptime.innerText = data.uptime;

                ping.classList.add(data.status.ping);
                if (data.status.ping === "danger") ping.classList.add("shake");

                ram.classList.add(data.status.ram);
                if (data.status.ram === "warning") ram.classList.add("glow");
                if (data.status.ram === "danger") ram.classList.add("glow");

                cpu.classList.add(data.status.cpu);
                if (data.status.cpu === "danger") cpu.classList.add("pulse");

                document.getElementById("guilds").innerText = data.guilds;

                document.getElementById("onlinePercent").innerText = data.onlinePercent+"%";
                document.getElementById("disconnectCount").innerText = data.disconnectCount;
                document.getElementById("longestUptime").innerText = data.longestUptime;
                document.getElementById("lastRestart").innerText = data.time;

                pingData.push(data.ping ?? 0);
                ramData.push(data.ram);

                if (ramData.length > 60) ramData.shift();
                if (pingData.length > 60) pingData.shift();

                pingChart.data.labels = pingData.map((_, i) => i);
                pingChart.data.datasets[0].data = pingData;
                pingChart.update("none");

                ramChart.data.labels = ramData.map((_, i) => i);
                ramChart.data.datasets[0].data = ramData;
                ramChart.update("none");

                if (data.version) {
                    document.getElementById("version").textContent = "v" + data.version;
                    document.getElementById("node").textContent = data.node;
                    document.getElementById("discordjs").textContent = "v" + data.discordjs;
                    document.getElementById("express").textContent = "v" + data.express;
                    document.getElementById("host").textContent = data.host;
                }
            });

            document.addEventListener("DOMContentLoaded", () => {
                const modal = document.getElementById("uptimeModal");
                const closeBtn = document.getElementById("closeModal");
                const uptimeBtn = document.getElementById("uptimeStat");
                const themeBtn = document.getElementById("themeBtn");

                uptimeBtn.addEventListener("click", () => {
                    modal.classList.add("show");
                });

                closeBtn.addEventListener("click", () => {
                    modal.classList.remove("show");
                });

                window.addEventListener("click", (e) => {
                    if (e.target === modal) {
                        modal.classList.remove("show");
                    }
                });
            });

            function setTheme(mode) {
                document.documentElement.setAttribute("data-theme", mode);
                localStorage.setItem("theme", mode);
                updateThemeButton();
            }

            const saved = localStorage.getItem("theme") || "dark";
            setTheme(saved);

            themeBtn.addEventListener("click", () => {
                const current = document.documentElement.getAttribute("data-theme");
                setTheme(current === "dark" ? "light" : "dark");
            });

            function updateThemeButton() {
                const theme = document.documentElement.getAttribute("data-theme");

                themeBtn.innerHTML =
                    theme === "light"
                     ? "☀️ Light Mode"
                     : "🌙 Dark Mode";
            }

            </script>
            <div id="uptimeModal" class="modal">

                <div class="modal-content">

                    <div class="modal-header">
                        <h2>🕒 Uptime History</h2>
                        <span id="closeModal">&times;</span>
                    </div>

                    <div class="uptime-bar">
                        <div id="uptimeBlocks"></div>
                    </div>

                    <div class="uptime-info">

                        <div class="info-row">
                            <span>🟢 Online</span>
                            <span id="onlinePercent">0%</span>
                        </div>

                        <div class="info-row">
                            <span>🔴 Disconnect</span>
                            <span id="disconnectCount">0</span>
                        </div>

                        <div class="info-row">
                            <span>⏱ Uptime Lâu Nhất</span>
                            <span id="longestUptime">0 phút</span>
                        </div>

                        <div class="info-row">
                            <span>🔄 Khởi Động Lại Lần Cuối</span>
                            <span id="lastRestart">--</span>
                        </div>

                    </div>

                </div>

            </div>
        </body>
    </html>
    `);

    });

    app.get("/ping", (req, res) => {
        res.json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: Date.now()
        });
    });

    io.on("connection", socket => {

        socket.emit("history", {
            ram: ramHistory,
            ping: pingHistory,
            uptime: uptimeHistory
        });

        if (statsCache)
            socket.emit("stats", statsCache);

    });

    setInterval(() => {

        if (statsCache)
            io.emit("stats", statsCache);

    }, 1000);

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 Web Server Chạy Ở Cổng ${PORT}`);
    });

    const https = require("https");

    setInterval(() => {
        https.get(URL, res => {
            if (res.statusCode !== 200) {
                console.log("⚠️ Ping fail:", res.statusCode);
            }
        }).on("error", err => {
            console.log("❌ Lỗi Duy Trì Kết Nối:", err.message);
        });

    }, 4 * 60 * 1000);

};
