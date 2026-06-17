const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ramHistory = [];
const pingHistory = [];
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

    setInterval(() => {

        if (!client?.isReady?.()) return;
        if (!client?.ws) return;

        const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const ping = client.ws?.ping || 0;

        const uptime = formatUptime(Math.floor(process.uptime()));

        statsCache = {
            ping,
            users: client.users.cache.size,
            guilds: client.guilds.cache.size,
            ram,
            uptime,
            time: new Date().toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh"
            })
        };

        // ===== lưu history =====
        ramHistory.push(ram);
        pingHistory.push(ping ?? 0);

        if (ramHistory.length > MAX_POINTS) ramHistory.shift();
        if (pingHistory.length > MAX_POINTS) pingHistory.shift();

    }, 1000);

    app.get("/", (req, res) => {

        const online = client.isReady();

        const statusText = online ? "ONLINE" : "OFFLINE";

        res.send(`
    <html>
    <head>
        <script>
            if (localStorage.getItem("theme") === "light") {
                document.documentElement.classList.add("light");
            }
            </script>

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
    width:90%;
    max-width:600px;

    background: var(--card);

    backdrop-filter:blur(15px);

    border: 1px solid var(--border);;

    border-radius:20px;

    padding:30px;

    box-shadow:0 0 30px rgba(0,0,0,0.4);

    transition:0.3s;
}

.card:hover{
    transform:translateY(-5px);
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

html.light .loading-spinner{
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
.chart-overlay{
    display:none;
    position:fixed;
    inset:0;
    background: rgba(0,0,0,0.6);
    backdrop-filter:blur(8px);
    justify-content:center;
    align-items:center;
    z-index:9999;
    animation:fadeIn .2s ease;
}

.chart-modal{
    width:90%;
    max-width:850px;
    background:var(--card);
    border:1px solid var(--border);
    border-radius:18px;
    padding:20px;
    box-shadow:0 20px 60px rgba(0,0,0,.5);
    transform:scale(.9);
    animation:pop .25s ease forwards;
}

.chart-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:10px;
}

.chart-header h3{
    margin:0;
    font-size:18px;
}

.close-btn{
    background: var(--danger);
    border:none;
    color:white;
    width:35px;
    height:35px;
    border-radius:10px;
    cursor:pointer;
    font-size:16px;
    transition:.2s;
}

.close-btn:hover{
    transform:scale(1.1);
    background:#ff3333;
}

@keyframes fadeIn{
    from{opacity:0;}
    to{opacity:1;}
}

@keyframes pop{
    to{transform:scale(1);}
}

        </style>
    </head>
    <body>
        
        <button id="themeBtn">🌙 Dark Mode</button>

        <div class="card">
            <div id="chartBox" class="chart-overlay" onclick="handleOverlayClick(event)">
                <div class="chart-modal">
                    <div class="chart-header">
                        <h3 id="chartTitle">📊 Biểu đồ</h3>
                        <button class="close-btn" onclick="closeChart()">✖</button>
                    </div>

                    <canvas id="chartCanvas"></canvas>
                </div>
            </div>

            <h1>
                🤖 ${client.user ? client.user.username : "Bot Lâm Đồng"}
            </h1>

            <div class="status">
               <span class="dot ${online ? "online" : "offline"}"></span>
                 ${statusText}
            </div>

            <div class="stat" onclick="openChart('ping')">
             <span>⚡ Ping</span>
                <span id="ping" class="loading-spinner"></span>
            </div>

            <div class="stat">
             <span>🏠 Servers</span>
                <span id="guilds">${online ? client.guilds.cache.size : 0}</span>
            </div>

            <div class="stat">
             <span>👥 Users</span>
                <span id="users">${online ? client.users.cache.size : 0}</span>
            </div>

            <div class="stat" onclick="openChart('ram')">
             <span>💾 RAM</span>
                <span id="ram" class="loading-spinner"></span>
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
        
            <script src="/socket.io/socket.io.js"></script>

            <script>
            const socket = io();
            let chart;
            let ramData = [];
            let pingData = [];

            socket.on("history", (data) => {
                ramData = data?.ram || [];
                pingData = data?.ping || [];
            });

            function openChart(type) {
                document.getElementById("chartBox").style.display = "flex";

                const ctx = document.getElementById("chartCanvas");

                const data = type === "ram" ? ramData : pingData;

                document.getElementById("chartTitle").innerText =
                    type === "ram" ? "💾 RAM Usage" : "⚡ Ping History";

                if (!data || data.length === 0) {
                    alert("📊 Chưa Có Dữ Liệu!");
                    return;
                }

                if (chart) chart.destroy();

                chart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: data.map((_, i) => i),
                        datasets: [{
                            label: type.toUpperCase(),
                            data: data,
                            borderColor: type === "ram" ? "#3b82f6" : "#22c55e",
                            backgroundColor: "rgba(59,130,246,0.1)",
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        animation: {
                            duration: 600
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    color: "#fff"
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: "rgba(255,255,255,0.05)" }
                            },
                            y: {
                                beginAtZero: true,
                                grid: { color: "rgba(255,255,255,0.05)" }
                            }
                        }
                    }
                });
            }

            function closeChart() {
                document.getElementById("chartBox").style.display = "none";
            }
            
            socket.on("stats", (data) => {

                const ping = document.getElementById("ping");
                const ram = document.getElementById("ram");
                const time = document.getElementById("time");
                const uptime = document.getElementById("uptime");

                ping.classList.remove("loading-spinner");
                ram.classList.remove("loading-spinner");
                time.classList.remove("loading-spinner");
                uptime.classList.remove("loading-spinner");

                pingData.push(data.ping ?? 0);
                ramData.push(data.ram);
                time.innerText = data.time;

                if (ramData.length > 60) ramData.shift();
                if (pingData.length > 60) pingData.shift();

                ping.innerText = data.ping != null ? data.ping + " ms" : "N/A";
                ram.innerText = data.ram + " MB";
                uptime.innerText = data.uptime;

                document.getElementById("guilds").innerText = data.guilds;
                document.getElementById("users").innerText = data.users;

                if (chart) {
                    const currentData = chart.data.datasets[0].label === "RAM"
                        ? ramData
                        : pingData;

                    chart.data.labels = currentData.map((_, i) => i);
                    chart.data.datasets[0].data = currentData;
                    chart.update("none");
                }
            });

            const themeBtn = document.getElementById("themeBtn");

            updateThemeButton();

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
                    theme === "light" ? "☀️ Light" : "🌙 Dark";
            }
            
            function handleOverlayClick(event) {
                if (event.target === event.currentTarget) {
                    closeChart();
                }
            }

            function closeChart() {
                document.getElementById("chartBox").style.display = "none";
                if (chart) {
                    chart.destroy();
                    chart = null;
                }
            }

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    closeChart();
                }
            });
            
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
            ping: pingHistory
        });

        const interval = setInterval(() => {

            if (statsCache)
                socket.emit("stats", statsCache);

        }, 1000);

        socket.on("disconnect", () => {
            clearInterval(interval);
        });

    });

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 Web Server Chạy Ở Cổng ${PORT}`);
    });

    const https = require("https");

    setInterval(() => {

        https.get(URL, () => { }).on("error", () => { });

        console.log("🔄 Đã Gửi Tín Hiệu Giữ Kết Nối");

    }, 4 * 60 * 1000);

};
