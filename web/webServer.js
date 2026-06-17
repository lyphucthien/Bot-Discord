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
            users: client.users.cache?.size || 0,
            guilds: client.guilds.cache?.size || 0,
            ram,
            uptime
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
        <meta http-equiv="refresh" content="30">

        <style>
:root{
    --bg1:#0f172a;
    --bg2:#1e293b;
    --bg3:#0f172a;
    --bg4:#2563eb;

    --card:rgba(255,255,255,.08);
    --text:white;
    --border:rgba(255,255,255,.15);
    --stat:rgba(255,255,255,.05);
}

html.light{

    --bg1:#f8fafc;
    --bg2:#e2e8f0;
    --bg3:#ffffff;
    --bg4:#dbeafe;

    --card:rgba(255,255,255,.9);
    --text:#111827;
    --border:#d1d5db;
    --stat:#f3f4f6;

}

body{
    margin:0;
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:center;

    background:linear-gradient(
        -45deg,
        var(--bg1),
        var(--bg2),
        var(--bg3),
        var(--bg4)
    );

    background-size:400% 400%;
    animation:gradient 15s ease infinite;

    color:var(--text);
    font-family:Arial;

    transition:
        background .4s ease,
        color .3s ease;
}

@keyframes gradient{
    0%{background-position:0% 50%;}
    50%{background-position:100% 50%;}
    100%{background-position:0% 50%;}
}

.card{
    width:90%;
    max-width:600px;

    background:var(--card);

    backdrop-filter:blur(15px);

    border:1px solid var(--border);

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
    background: rgba(255,255,255,.12);
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
        </style>
    </head>
    <body>
        
        <button id="themeBtn">🌙 Dark Mode</button>

        <div class="card">
            <div id="chartBox" style="
                display:none;
                position:fixed;
                top:0; left:0;
                width:100%; height:100%;
                background:rgba(0,0,0,0.7);
                justify-content:center;
                align-items:center;
                z-index:9999;
            ">
                <div style="
                    width:85%;
                    max-width:800px;
                    background:#fff;
                    padding:20px;
                    border-radius:15px;
                ">
                    <canvas id="chartCanvas"></canvas>
                    <br>
                    <button onclick="closeChart()">Đóng</button>
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
                <span id="ping">Loading...</span>
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
                <span id="ram">${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</span>
            </div>

            <div class="stat">
              <span>📅 Time</span>
                <span id="time">Loading...</span>
            </div>

            <div class="stat">
                <span>🕒 Uptime</span>
             <span id="uptime">Loading...</span>
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

                let data = type === "ram" ? ramData : pingData;

                if (!data || data.length === 0) {
                    alert("📊 Chưa Có Dữ Liệu Để Hiển Thị!");
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
                            borderColor: type === "ram" ? "blue" : "green",
                            fill: false,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        animation: false,
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            }

            function closeChart() {
                document.getElementById("chartBox").style.display = "none";
            }

            function updateClock() {
                const now = new Date();
                document.getElementById("time").innerText =
                    now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
            }

            socket.on("stats", (data) => {

                document.getElementById("ping").innerText =
                    data.ping !== null ? data.ping + " ms" : "N/A";

                document.getElementById("guilds").innerText = data.guilds;
                document.getElementById("users").innerText = data.users;
                document.getElementById("ram").innerText = data.ram + " MB";
                document.getElementById("uptime").innerText = data.uptime;

                // 👉 update chart live nếu đang mở
                if (chart) {
                    const currentData = chart.data.datasets[0].label === "RAM"
                        ? ramData
                        : pingData;

                    chart.data.labels = currentData.map((_, i) => i);
                    chart.data.datasets[0].data = currentData;
                    chart.update();
                }
            });

            setInterval(updateClock, 1000);
            updateClock();

            const themeBtn = document.getElementById("themeBtn");

            const savedTheme = localStorage.getItem("theme");

            if (savedTheme === "light") {
                document.documentElement.classList.add("light");
            }

            updateThemeButton();

            themeBtn.addEventListener("click", () => {

                document.documentElement.classList.toggle("light");

                if (document.documentElement.classList.contains("light")) {
                    localStorage.setItem("theme", "light");
                } else {
                    localStorage.setItem("theme", "dark");
                }

                updateThemeButton();
            });

            function updateThemeButton() {

                if (document.documentElement.classList.contains("light")) {
                    themeBtn.innerHTML = "☀️ Light";
                } else {
                    themeBtn.innerHTML = "🌙 Dark";
                }

            };

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
