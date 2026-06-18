const express = require("express");
const si = require("systeminformation");
const http = require("http");
const { Server } = require("socket.io");
const ramHistory = [];
const pingHistory = [];
const cpuHistory = [];
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

    let statsCache = null;

    setInterval(async () => {

        if (!client?.isReady?.()) return;
        if (!client?.ws) return;

        const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const ping = client.ws?.ping ?? 0;
        const cpu = Number((await si.currentLoad()).currentLoad.toFixed(1));

        const uptime = formatUptime(Math.floor(process.uptime()));

        statsCache = {
            ping,
            ram,
            cpu,
            guilds: client.guilds.cache.size,
            uptime,
            time: new Date().toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh"
            })
        };

        ramHistory.push(ram);
        pingHistory.push(ping ?? 0);
        cpuHistory.push(cpu);

        if (ramHistory.length > MAX_POINTS) ramHistory.shift();
        if (pingHistory.length > MAX_POINTS) pingHistory.shift();
        if (cpuHistory.length > MAX_POINTS) cpuHistory.shift();

    }, 1000);

    app.get("/", (req, res) => {

        const online = client.isReady();

        const statusText = online ? "ONLINE" : "OFFLINE";

        res.send(`
    <html>
    <head>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <title>🤖 Bot Dashboard</title>

        <style>

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

body {
    margin:0;
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:center;

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
    max-width:1700px;

    display:flex;
    justify-content:center;
    align-items:center;
    gap:35px;
    padding:40px;
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

.chart-card{
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
        </style>
    </head>
    <body>
        
        <button id="themeBtn">🌙 Dark</button>

        <div class="dashboard">

            <div class="left-charts">

                <div class="chart-card small">
                    <h2>⚡ Ping</h2>
                    <canvas id="pingChart"></canvas>
                </div>

                <div class="chart-card small">
                    <h2>🖥 CPU</h2>
                    <canvas id="cpuChart"></canvas>
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

            <div class="stat">
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
            let cpuChart;

            let pingData = [];
            let ramData = [];
            let cpuData = [];

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

            cpuChart = new Chart(document.getElementById("cpuChart"), {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239,68,68,.15)",
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
                        x: { display: false },
                        y: { beginAtZero: true }
                    }
                }
            });

            socket.on("history", data => {

                pingData = data.ping || [];
                ramData = data.ram || [];
                cpuData = data.cpu || [];

                pingChart.data.labels = pingData.map((_, i) => i);
                pingChart.data.datasets[0].data = pingData;
                pingChart.update();

                ramChart.data.labels = ramData.map((_, i) => i);
                ramChart.data.datasets[0].data = ramData;
                ramChart.update();

                cpuChart.data.labels = cpuData.map((_, i) => i);
                cpuChart.data.datasets[0].data = cpuData;
                cpuChart.update();

            });
            
            socket.on("stats", (data) => {

                const ping = document.getElementById("ping");
                const ram = document.getElementById("ram");
                const time = document.getElementById("time");
                const uptime = document.getElementById("uptime");
                const cpu = document.getElementById("cpu");

                ping.classList.remove("loading-spinner");
                ram.classList.remove("loading-spinner");
                time.classList.remove("loading-spinner");
                uptime.classList.remove("loading-spinner");
                cpu.classList.remove("loading-spinner");

                pingData.push(data.ping ?? 0);
                ramData.push(data.ram);
                cpuData.push(data.cpu);
                
                time.innerText = data.time;

                const MAX = 60;
                if (pingData.length > MAX) pingData.shift();
                if (ramData.length > MAX) ramData.shift();
                if (cpuData.length > MAX) cpuData.shift();

                ping.innerText = data.ping != null ? data.ping + " ms" : "N/A";
                ram.innerText = data.ram + " MB";
                cpu.innerText = data.cpu + " %";
                uptime.innerText = data.uptime;

                document.getElementById("guilds").innerText = data.guilds;

                pingChart.data.labels = pingData.map((_, i) => i);
                pingChart.data.datasets[0].data = pingData;
                pingChart.update("none");

                ramChart.data.labels = ramData.map((_, i) => i);
                ramChart.data.datasets[0].data = ramData;
                ramChart.update("none");

                cpuChart.data.labels = cpuData.map((_, i) => i);
                cpuChart.data.datasets[0].data = cpuData;
                cpuChart.update("none");

            });

            const themeBtn = document.getElementById("themeBtn");

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
            cpu: cpuHistory
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

        https.get(URL, () => { }).on("error", () => { });

        console.log("🔄 Đã Gửi Tín Hiệu Giữ Kết Nối");

    }, 4 * 60 * 1000);

};
