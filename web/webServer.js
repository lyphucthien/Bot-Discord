const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

module.exports = (client) => {

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    const PORT = process.env.PORT || 3000;
    const URL = "https://my-discord-bot-mfu0.onrender.com";

    function formatUptime() {
        const totalSeconds = Math.floor(process.uptime());

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${days} ngày ${hours} giờ ${minutes} phút`;
    }

    let statsCache = null;

    setInterval(() => {

        if (!client.isReady()) return;

        statsCache = {
            ping: client.ws.ping,
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            ram: Math.round(process.memoryUsage().rss / 1024 / 1024),
            uptime: Math.floor(process.uptime())
        };

    }, 1000);

    app.get("/", (req, res) => {

        const online = client.isReady();

        const statusText = online ? "ONLINE" : "OFFLINE";

        res.send(`
    <html>
    <head>
    
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

body.light{

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
}

.online{
    background:#22c55e;
    box-shadow:
        0 0 10px #22c55e,
        0 0 20px #22c55e;
}

.offline{
    background:#ef4444;
    box-shadow:
        0 0 10px #ef4444,
        0 0 20px #ef4444;
}

.stat{
    transition:0.2s;
    cursor:pointer;
    display:flex;
    justify-content:space-between;

    padding:12px;
    margin:10px 0;

    background:var(--stat);

    border-radius:10px;
}  
#themeBtn{
    position:fixed;
    top:20px;
    right:20px;

    padding:10px 18px;

    border:none;
    border-radius:12px;

    cursor:pointer;

    font-size:15px;
    font-weight:bold;

    background:#2563eb;
    color:white;

    box-shadow:0 8px 20px rgba(0,0,0,.25);

    transition:
        transform .2s ease,
        box-shadow .2s ease,
        background .3s ease;
}

#themeBtn:hover{
    transform:scale(1.05);
}
        </style>
    </head>
    <body>
        
        <button id="themeBtn">🌙 Dark Mode</button>

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

            <div class="stat">
              <span>💾 RAM</span>
                <span id="ram">${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</span>
            </div>

            <div class="stat">
              <span>📅 Time</span>
                <span id="time">Loading...</span>
            </div>

            <div class="stat">
                <span>🕒 Uptime</span>
             <span>${formatUptime()}</span>
            </div>

            <hr style="border:none;height:1px;background:rgba(255, 255, 255, 0.13);margin:20px 0;">
            <div style="opacity:.7">
             💻 Created By Lý Phúc Thiện
             
            </div>

        </div>
        
            <script src="/socket.io/socket.io.js"></script>

            <script>
            const socket = io();

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
            });

            setInterval(updateClock, 1000);
            updateClock();

            const themeBtn = document.getElementById("themeBtn");

            const savedTheme = localStorage.getItem("theme");

            if (savedTheme === "light") {
                document.body.classList.add("light");
            }

            updateThemeButton();

            themeBtn.addEventListener("click", () => {
                document.body.classList.toggle("light");

                if (document.body.classList.contains("light")) {
                    localStorage.setItem("theme", "light");
                } else {
                    localStorage.setItem("theme", "dark");
                }

                updateThemeButton();
            });

            function updateThemeButton() {
                if (document.body.classList.contains("light")) {
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

    setInterval(async () => {

        try {

            await fetch(URL);

            console.log("🔄 Đã Gửi Tín Hiệu Giữ Kết Nối");

        } catch {

            console.log("❌ Ping Failed");

        }

    }, 4 * 60 * 1000);

};
