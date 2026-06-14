require('./database/sqlite');

const fs = require('fs');
const config = require('./config.json');
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const { Client, GatewayIntentBits, Collection } = require('discord.js');

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const PORT = process.env.PORT || 3000;

function formatUptime() {
    const totalSeconds = Math.floor(process.uptime());

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${days} ngày ${hours} giờ ${minutes} phút`;
}

app.get("/", (req, res) => {

    const online = client.isReady();

    const statusIcon = online ? "🟢" : "🔴";
    const statusText = online ? "ONLINE" : "OFFLINE";

    res.send(`
    <html>
    <head>
        <title>🤖 Bot Dashboard</title>
        <meta http-equiv="refresh" content="30">
        <style>
body{
    margin:0;
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:center;

    background:linear-gradient(
        -45deg,
        #0f172a,
        #1e293b,
        #0f172a,
        #2563eb
    );

    background-size:400% 400%;
    animation:gradient 15s ease infinite;

    color:white;
    font-family:Arial;
}

@keyframes gradient{
    0%{background-position:0% 50%;}
    50%{background-position:100% 50%;}
    100%{background-position:0% 50%;}
}

.card{
    width:90%;
    max-width:600px;

    background:rgba(255,255,255,0.08);

    backdrop-filter:blur(15px);

    border:1px solid rgba(255,255,255,0.15);

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

    background:rgba(255,255,255,0.05);

    border-radius:10px;
}  
        </style>
    </head>
    <body>

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

            /* CLOCK */
            function updateClock() {
                const now = new Date();
                document.getElementById("time").innerText =
                    now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
            }

            /* REALTIME DATA */
            socket.on("stats", (data) => {

                document.getElementById("ping").innerText =
                    data.ping !== null ? data.ping + "ms" : "N/A";

                document.getElementById("guilds").innerText = data.guilds;
                document.getElementById("users").innerText = data.users;
                document.getElementById("ram").innerText = data.ram + " MB";
            });

            setInterval(updateClock, 1000);
            updateClock();
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

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web Server chạy ở cổng ${PORT}`);
});
const URL = "https://my-discord-bot-mfu0.onrender.com";

let statsCache = null;

setInterval(() => {
    if (!client.isReady()) return;

    statsCache = {
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        ram: Math.round(process.memoryUsage().rss / 1024 / 1024),
        time: new Date().toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh"
        }),
        uptime: Math.floor(process.uptime())
    };
}, 1000);

io.on("connection", (socket) => {
    console.log("🟢 Dashboard Đã Kết Nối");

    const interval = setInterval(() => {
        if (statsCache) socket.emit("stats", statsCache);
    }, 1000);

    socket.on("disconnect", () => {
        clearInterval(interval);
        console.log("🔴 Dashboard Mất Kết Nối");
    });
});

setInterval(async () => {
    try {
        await fetch(`${URL}`);
        console.log("🔄 Đã Gửi Tín Hiệu Giữ Kết Nối");
    } catch (err) {
        console.log("❌ Ping failed");
    }
}, 4 * 60 * 1000);


client.commands = new Collection();

const eventFiles = fs
    .readdirSync('./events')
    .filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    event(client);
}

const commandFiles = fs
    .readdirSync('./commands')
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {

    const command =
        require(`./commands/${file}`);

    console.log(
        `✅ Loaded Command: ${command.data.name}`
    );

    client.commands.set(
        command.data.name,
        command
    );
}

client.login(process.env.TOKEN);

client.on('error', console.error);
