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
    
    const path = require("path");

    app.use("/music",express.static(path.resolve(__dirname, "public/music")));

    const PORT = process.env.PORT || 10000;
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

    app.get("/", (req, res) => {

        const online = client.isReady();

        const statusText = online ? "ONLINE" : "OFFLINE";

        res.send(`
    <html>
    <head>
        <script>
        (() => {
            const theme = localStorage.getItem("theme") || "dark";
            document.documentElement.setAttribute("data-theme", theme);
        })();
        </script>

            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <title>🤖 Bot Dashboard - Xem Trạng Thái Bot Discord Của Bot Lâm Đồng</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

        <style>
* {
    box-sizing: border-box;
}

#settingsModal .menu-item {
    cursor: pointer;
    transition: .2s;
}

#settingsModal .menu-item:hover {
    transform: translateX(6px);
    background: var(--card);
}
    
.menu-item {
    padding: 12px 14px;
    margin-bottom: 10px;
    border-radius: 10px;
    cursor: pointer;
    background: var(--stat);
    transition: 0.2s;
    font-size: 16px;
}

.menu-item:hover{

    transform: translateX(8px)
        scale(1.03);

    box-shadow: 0 8px 20px rgba(0,0,0,.2);

}

@media (max-width: 1024px) {

    .dashboard {
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .card,
    .chart-card {
        width: 95%;
    }

    .chart-card {
        height: 320px;
    }
}

@media (max-width: 768px) {

    body {
        padding: 10px;
    }

    .top-bar {
        grid-template-columns: repeat(2, 1fr);
    }

    .top-value {
        font-size: 16px;
    }

    #menuBtn {
        width: 45px;
        height: 45px;
        font-size: 22px;
    }

    #themeBtn {
        font-size: 12px;
        padding: 10px 14px;
    }

    .card {
        padding: 20px;
    }

    .status {
        font-size: 22px;
    }
}

@media (max-width: 480px) {

    .top-bar {
        grid-template-columns: 1fr;
    }

    .dashboard {
        gap: 15px;
    }

    .chart-card {
        height: 260px;
    }

    .stat {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
        font-size: 14px;
    }

    h1 {
        font-size: 20px;
    }

    .top-value {
        font-size: 14px;
    }
}

#menuBtn{
    position:fixed;
    top:20px;
    left:20px;

    width:52px;
    height:52px;

    border:none;
    border-radius:14px;

    cursor:pointer;

    font-size:28px;

    background:var(--card);
    color:var(--text);

    border:1px solid var(--border);

    backdrop-filter:blur(15px);

    transition:opacity .25s, transform .25s;

    z-index:10001;
}

#menuBtn:hover{
    transform:scale(1.08);
}

#menuOverlay{

    position:fixed;
    inset:0;

    background:rgba(0,0,0,.45);

    backdrop-filter:blur(4px);

    opacity:0;
    visibility:hidden;

    transition:.3s;

    z-index:9998;

}

#menuOverlay.show{
    opacity:1;
    visibility:visible;
}

#sideMenu{

    position:fixed;

    top:0;
    left:-420px;

    width:380px;
    max-width:90%;

    height:100%;

    background:var(--card);

    backdrop-filter:blur(18px);

    border-right:1px solid var(--border);

    transition:left .35s ease;

    z-index:9999;

    display:flex;
    flex-direction:column;

    box-shadow: 15px 0 40px rgba(0,0,0,.4);
}

#sideMenu.show{
    left:0;
}

.menu-header{

    display:flex;
    justify-content:space-between;
    align-items:center;

    padding:22px;

    border-bottom:1px solid var(--border);

}

.menu-header h2{
    margin:0;
}

#closeMenu{

    cursor:pointer;
    font-size:28px;

}

.menu-content{

    padding:25px;

    font-size:18px;

    opacity:.9;

}

.top-bar{
    width:100%;
    max-width:920px;

    margin: 0 auto 5px;
    box-shadow:var(--shadow);

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

[data-theme="dark"] {
    --bg: #0b1120;
    --bg2: #111827;

    --card: rgba(17,24,39,.65);
    --text: #ffffff;
    --border: rgba(255,255,255,.08);
    --stat: rgba(255,255,255,.05);

    --primary: #3b82f6;
    --success: #22c55e;
    --danger: #ef4444;

    --shadow: 0 20px 45px rgba(0,0,0,.45);
}

[data-theme="light"] {

    --bg:#f5f7fb;
    --bg2:#e9eef7;

    --card:rgba(255,255,255,.92);

    --text:#111827;

    --border:#dbe4ef;

    --stat:#f8fafc;

    --primary:#2563eb;
    --success:#16a34a;
    --danger:#dc2626;

    --shadow:0 15px 40px rgba(0,0,0,.08);
}

[data-theme="oled"]{

    --bg:#000000;
    --bg2:#000000;

    --card:rgba(255,255,255,.03);

    --text:#ffffff;

    --border:rgba(255,255,255,.05);

    --stat:rgba(255,255,255,.02);

    --primary:#00e5ff;
    --success:#00ff99;
    --danger:#ff3355;

    --shadow:0 0 25px rgba(0,255,255,.08);
}

html, body {
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
}

body {
    margin:0;
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:flex-start;

    padding: 15px 40px 40px;

    background: radial-gradient(circle at top left,#1d4ed8 0%,transparent 35%), radial-gradient(circle at bottom right,#7c3aed 0%,transparent 35%),
    linear-gradient( 135deg, var(--bg), var(--bg2));

    background-size: 400% 400%;
    animation: gradient 15s ease infinite;

    color: var(--text);
    font-family:
    Inter,
    Segoe UI,
    Roboto,
    Arial,
    sans-serif;

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
    box-shadow: var(--shadow);

    transition:.25s;
}

.card:hover{

    transform: translateY(-8px)
        scale(1.01);

    border-color:rgba(59,130,246,.3);

}

.dashboard {
    width:100%;

    display:flex;
    justify-content:center;
    align-items:center;
    gap: 35px;
    padding: 20px;
    flex-wrap: wrap;
}

.chart-card{
    width:320px;
    height:600px;

    flex-shrink:0;

    background:var(--card);
    backdrop-filter:blur(25px);
    box-shadow:var(--shadow);
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

    background: linear-gradient(
        135deg,
        var(--primary),
        color-mix(in srgb, var(--primary) 60%, white)
    );
    color: white;

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

.setting-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin:18px 0;
}

.setting-row label{
    font-weight:bold;
}

.setting-row select{
    padding:8px;
    border-radius:8px;
    background:var(--card);
    color:var(--text);
    border:1px solid var(--border);
}

.setting-row input[type="color"]{
    width:60px;
    height:35px;
    border:none;
    background:none;
    cursor:pointer;
}

#saveSettings{
    margin-top:20px;
    width:100%;
    padding:14px;

    border:none;
    border-radius:12px;
    cursor:pointer;
    font-size:16px;
    font-weight:bold;

    background: linear-gradient(
        135deg,
        var(--primary),
        color-mix(in srgb, var(--primary) 60%, white)
    );
    color: white;
    transition:.25s;
}

#saveSettings:hover{
    transform:translateY(-2px);
}

.compact .card{
    padding:18px;
}

.compact .chart-card{
    height:350px;
}

.compact .stat{
    margin:6px 0;
    padding:8px;
}

.compact h1{
    font-size:22px;
}

.compact .status{
    font-size:22px;
}

.music-player{
    position:fixed;
    left:50%;
    bottom:20px;
    transform:translateX(-50%);

    width:520px;
    max-width:95%;
    display:flex;
    gap:15px;
    padding:18px;

    border-radius:18px;
    background:var(--card);
    border:1px solid var(--border);
    backdrop-filter:blur(15px);

    box-shadow:var(--shadow);
    z-index:9999;
}

.cover{
    width:90px;
    height:90px;

    border-radius:12px;
    object-fit:cover;
}

.player-body{
    flex:1;
}

.song-title{
    font-size:18px;
    font-weight:bold;
}

.artist{
    opacity:.7;
    margin-bottom:10px;
}

.controls{
    display:flex;
    justify-content:center;
    gap:10px;
    margin:10px 0;
}

.controls button{
    width:38px;
    height:38px;

    border:none;
    border-radius:50%;

    background:var(--primary);
    color:white;
    cursor:pointer;
}

.progress{
    display:flex;
    align-items:center;
    gap:10px;
}

.progress input{
    flex:1;
}

.volume{
    display:flex;
    align-items:center;
    gap:10px;
    margin-top:10px;
}

.volume input{
    flex:1;
}

.no-animation *,
.no-animation *::before,
.no-animation *::after{
    animation:none !important;
    transition:none !important;
}

.no-blur .card,
.no-blur .chart-card,
.no-blur #sideMenu,
.no-blur .top-bar,
.no-blur .modal-content{
    backdrop-filter:none !important;
}
.no-blur .music-player {
    backdrop-filter: none !important;
}
        </style>
    </head>
    <body>
        <button id="menuBtn">☰</button>

        <div id="menuOverlay"></div>

        <div id="sideMenu">

            <div class="menu-header">
                <h2>📋 Menu</h2>
                <span id="closeMenu">&times;</span>
            </div>

            <div class="menu-content">

                <div class="menu-item" id="settingsBtn">
                    ⚙️ Settings
                </div>

                <div class="menu-item" onclick="openLink('https://discord.gg/gyZ27Hw9qu')">
                    <i class="fa-brands fa-discord"></i> Discord Invite
                </div>

                <div class="menu-item" onclick="openLink('https://beacons.ai/lyphucthien')">
                    🌐 Nền Tảng MXH
                </div>

                <div class="menu-content">
                    🚧 Sẽ Có Cập Nhật Tiếp Theo...
                </div>

            </div>

        </div>

        <button id="themeBtn">🌙 Dark</button>
        <div class="page">

        <div class="top-bar">

            <div class="top-item">
                <div class="top-title">🤖 Version</div>
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
                <div class="top-title">😎 LPT</div>
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

            <h1 id="botName">
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
        
        <div id="settingsModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⚙️ Settings</h2>
                    <span id="closeSettings">&times;</span>
                </div>

                    <div class="menu-content">

                    <h3>🎨 Appearance</h3>

                    <div class="setting-row">

                        <label>Theme</label>

                    <select id="themeSelect">

                    <option value="dark">Dark</option>

                    <option value="light">Light</option>

                    <option value="oled">OLED</option>

                    </select>

                    </div>

                    <div class="setting-row">

                    <label>Animation</label>

                    <input
                        type="checkbox"
                        id="animationToggle"
                    checked>

                    </div>

                    <div class="setting-row">
                        <label>Blur Effect</label>

                    <input
                        type="checkbox"
                        id="blurToggle"
                        checked>

                    </div>

                    <hr>

                    <h3>📊 Dashboard</h3>

                    <div class="setting-row">
                        <label>Hiển Thị Biểu Đồ Ping</label>
                        <input type="checkbox" id="pingChartToggle" checked>
                    </div>

                    <div class="setting-row">
                        <label>Hiển Thị Biểu Đồ RAM</label>
                        <input type="checkbox" id="ramChartToggle" checked>
                    </div>

                    <div class="setting-row">
                        <label>Thanh Nhạc</label>
                        <input type="checkbox" id="musicToggle">
                    </div>

                    <hr>

                    <h3>🕒 Time</h3>

                    <div class="setting-row">
                        <label>Định Dạng Thời Gian</label>

                    <select id="timeFormatSelect">
                        <option value="24h">24 Hour</option>
                        <option value="12h">12 Hour</option>

                    </select>

                    </div>

                    <div class="setting-row">

                    <label>Accent Color</label>

                    <input
                        type="color"
                        id="accentPicker"
                        value="#3b82f6">

                    </div>

                    <br>
                        <button id="saveSettings">
                            💾 Save Settings
                        </button>
                    </div>
            </div>
        </div>

        <div class="chart-card">
            <h2>💾 RAM</h2>
            <canvas id="ramChart"></canvas>
        </div>

    </div>
        
            <script src="/socket.io/socket.io.js"></script>

            <script>
            function openLink(url) {
                window.open(url, "_blank", "noopener,noreferrer");
            }

            const socket = io();

                const defaultSettings = {
                    theme: "dark",
                    animation: true,
                    blur: true,
                    accent: "#3b82f6",

                    showPingChart: true,
                    showRamChart: true,
                    music: false,
                    compact: false,

                    timeFormat: "24h"

                };

            let settings = JSON.parse(localStorage.getItem("dashboardSettings")) || defaultSettings;

            function saveSettings(){

                localStorage.setItem(
                    "dashboardSettings",
                    JSON.stringify(settings)
                );

            }

            let pingChart;
            let ramChart;

            let pingData = [];
            let ramData = [];

            const playlist = [
                {
                    title: "Jessie Villa",
                    artist: "WILDFIRE",
                    src: "/music/Wildfire-JessieVilla.mp3",
                    cover: "/cover/123.jpg"
                }
            ];

            let currentSong = 0;
            let isShuffle = false;
            let isRepeat = false;
            let audio;

            function loadTrack(index) {
                const song = playlist[index];
                if (!song || !audio) return;

                document.getElementById("songTitle").innerText = song.title;
                document.getElementById("artist").innerText = song.artist;
                document.getElementById("cover").src = song.cover;

                audio.src = song.src;
                audio.load();
            }

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
                if (!data) return;

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

                const now = new Date();
                time.innerText = now.toLocaleString("vi-VN", {
                    hour12: settings.timeFormat === "12h",
                    timeZone: "Asia/Ho_Chi_Minh"
                });

                uptime.innerText = data.uptime;

                ping.classList.add(data.status.ping);
                if (data.status.ping === "danger") ping.classList.add("shake");

                ram.classList.add(data.status.ram);
                if (data.status.ram === "warning") ram.classList.add("glow");
                if (data.status.ram === "danger") ram.classList.add("glow");

                cpu.classList.add(data.status.cpu);
                if (data.status.cpu === "danger") cpu.classList.add("pulse");

                document.getElementById("guilds").innerText = data.guilds;

                const onlinePercent = document.getElementById("onlinePercent");
                const disconnectCount = document.getElementById("disconnectCount");
                const longestUptime = document.getElementById("longestUptime");
                const lastRestart = document.getElementById("lastRestart");

                if (onlinePercent)
                    onlinePercent.innerText = data.onlinePercent + "%";

                if (disconnectCount)
                    disconnectCount.innerText = data.disconnectCount;

                if (longestUptime)
                    longestUptime.innerText = data.longestUptime;

                if (lastRestart)
                    lastRestart.innerText = data.time;

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
                const themeBtn = document.getElementById("themeBtn");

                const modal = document.getElementById("uptimeModal");
                const closeBtn = document.getElementById("closeModal");
                const uptimeBtn = document.getElementById("uptimeStat");

                const menuBtn = document.getElementById("menuBtn");
                const sideMenu = document.getElementById("sideMenu");
                const menuOverlay = document.getElementById("menuOverlay");
                const closeMenu = document.getElementById("closeMenu");

                menuBtn.addEventListener("click", () => {
                    sideMenu.classList.add("show");
                    menuOverlay.classList.add("show");

                    menuBtn.style.opacity = "0";
                    menuBtn.style.transform = "scale(.8)";
                    menuBtn.style.pointerEvents = "none";
                });

                function closeSideMenu() {
                    sideMenu.classList.remove("show");
                    menuOverlay.classList.remove("show");

                    menuBtn.style.opacity = "1";
                    menuBtn.style.transform = "scale(1)";
                    menuBtn.style.pointerEvents = "auto";
                }

                closeMenu.addEventListener("click", closeSideMenu);
                menuOverlay.addEventListener("click", closeSideMenu);

                themeBtn.addEventListener("click", () => {
                    const current = document.documentElement.getAttribute("data-theme");

                    let next;

                    if (current === "dark") next = "light";
                    else if (current === "light") next = "oled";
                    else next = "dark";

                    setTheme(next);
                });

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

                audio = document.getElementById("bgMusic");
                loadTrack(currentSong);
                const playBtn = document.getElementById("playMusic");
                const volume = document.getElementById("volume");

                const progressBar = document.getElementById("progressBar");
                const currentTime = document.getElementById("currentTime");
                const duration = document.getElementById("duration");

                audio.volume = 0.5;

                function formatTime(sec){
                    const m = Math.floor(sec / 60);
                    const s = Math.floor(sec % 60);
                    return m + ":" + String(s).padStart(2,"0");
                }

                audio.onloadedmetadata = ()=>{
                    duration.innerText = formatTime(audio.duration);
                };

                audio.ontimeupdate = ()=>{
                    if(!audio.duration) return;

                    progressBar.value =
                        audio.currentTime / audio.duration * 100;

                    currentTime.innerText =
                        formatTime(audio.currentTime);
                };

                progressBar.oninput = ()=>{
                    audio.currentTime =
                        progressBar.value / 100 * audio.duration;
                };

                let isToggling = false;

                playBtn.onclick = async () => {
                    if (isToggling) return;
                    isToggling = true;

                    try {
                        if (audio.paused) {
                            await audio.play();
                            playBtn.innerHTML = "⏸";
                        } else {
                            audio.pause();
                            playBtn.innerHTML = "▶";
                        }
                    } catch (err) {
                        console.warn(err);
                    }

                    isToggling = false;
                };

                document.getElementById("nextBtn").onclick = () => {
                    currentSong++;

                    if (currentSong >= playlist.length) {
                        currentSong = 0;
                    }

                    loadTrack(currentSong);

                    audio.play();
                    playBtn.innerHTML = "⏸";
                };

                document.getElementById("prevBtn").onclick = () => {
                    currentSong--;

                    if (currentSong < 0) {
                        currentSong = playlist.length - 1;
                    }

                    loadTrack(currentSong);

                    audio.play();
                    playBtn.innerHTML = "⏸";
                };

                document.getElementById("shuffleBtn").onclick = () => {
                    isShuffle = !isShuffle;

                    document.getElementById("shuffleBtn").style.opacity =
                        isShuffle ? "1" : "0.4";
                };

                document.getElementById("repeatBtn").onclick = () => {
                    isRepeat = !isRepeat;

                    audio.loop = isRepeat;

                    document.getElementById("repeatBtn").style.opacity =
                        isRepeat ? "1" : "0.4";
                };

                volume.oninput = () => {
                    audio.volume = volume.value / 100;
                };
                
                audio.onended = () => {
                    if (isRepeat) return;

                    if (playlist.length <= 1) {
                        audio.play();
                        return;
                    }

                    if (isShuffle) {
                        currentSong = Math.floor(Math.random() * playlist.length);
                    } else {
                        currentSong = (currentSong + 1) % playlist.length;
                    }

                    loadTrack(currentSong);
                    audio.play();
                };

            });

            function setTheme(mode) {
                document.documentElement.setAttribute("data-theme", mode);
                localStorage.setItem("theme", mode);
                updateThemeButton();
            }

            function applySettings() {
                setTheme(settings.theme);

                document.documentElement.style.setProperty("--primary", settings.accent);

                document.body.classList.toggle("no-animation", !settings.animation);
                document.body.classList.toggle("no-blur", !settings.blur);

                const leftCharts = document.querySelector(".left-charts");
                if (leftCharts) {
                    leftCharts.style.display = settings.showPingChart ? "" : "none";
                }

                const ramChartCard = document.querySelectorAll(".chart-card")[1];
                if (ramChartCard) {
                    ramChartCard.style.display = settings.showRamChart ? "" : "none";
                }

                const musicBar = document.getElementById("musicBar");
                if (musicBar) {
                    musicBar.style.display = settings.music ? "flex" : "none";
                }
            }

            document.addEventListener("DOMContentLoaded", () => {
                const saved = localStorage.getItem("theme") || "dark";
                setTheme(saved);
                applySettings();
                updateThemeButton();
            });

            function updateThemeButton() {
                const theme = document.documentElement.getAttribute("data-theme");

                const map = {
                    dark: "🌙 Dark",
                    light: "☀️ Light",
                    oled: "⚫ OLED"
                };

                themeBtn.innerHTML = map[theme] || "🌙 Dark";
            }

            const settingsBtn = document.getElementById("settingsBtn");
            const settingsModal = document.getElementById("settingsModal");
            const closeSettings = document.getElementById("closeSettings");
            const themeSelect = document.getElementById("themeSelect");
            const animationToggle = document.getElementById("animationToggle");
            const blurToggle = document.getElementById("blurToggle");
            const accentPicker = document.getElementById("accentPicker");

            const pingChartToggle = document.getElementById("pingChartToggle");
            const ramChartToggle = document.getElementById("ramChartToggle");
            const musicToggle = document.getElementById("musicToggle");

            const timeFormatSelect = document.getElementById("timeFormatSelect");
            
            const saveBtn = document.getElementById("saveSettings");

            settingsBtn.addEventListener("click",()=>{
                themeSelect.value = settings.theme;
                animationToggle.checked = settings.animation;
                blurToggle.checked = settings.blur;
                accentPicker.value = settings.accent;

                pingChartToggle.checked = settings.showPingChart;
                ramChartToggle.checked = settings.showRamChart;
                musicToggle.checked = settings.music;

                timeFormatSelect.value = settings.timeFormat;

                settingsModal.classList.add("show");
            });

            closeSettings.addEventListener("click", () => {
                settingsModal.classList.remove("show");
            });

            window.addEventListener("click", (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove("show");
                }
            });

            saveBtn.onclick=()=>{
                settings.theme=themeSelect.value;
                settings.animation=animationToggle.checked;
                settings.blur=blurToggle.checked;
                settings.accent=accentPicker.value;

                settings.showPingChart = pingChartToggle.checked;
                settings.showRamChart = ramChartToggle.checked;
                settings.music = musicToggle.checked;

                settings.timeFormat = timeFormatSelect.value;

                saveSettings();
                applySettings();
                loadTrack(currentSong);
                settingsModal.classList.remove("show");
            };

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

            <div id="musicBar" class="music-player">

                <img
                    id="cover"
                    src="/cover.jpg"
                    class="cover">

                <div class="player-body">

                    <div class="song-title" id="songTitle">
                        Never Gonna Give You Up
                    </div>

                    <div class="artist" id="artist">
                        Rick Astley
                    </div>

                    <div class="controls">
                        <button id="prevBtn">⏮</button>
                        <button id="playMusic">▶</button>
                        <button id="nextBtn">⏭</button>

                        <button id="shuffleBtn">🔀</button>
                        <button id="repeatBtn">🔁</button>

                    </div>

                    <div class="progress">

                        <span id="currentTime">0:00</span>

                        <input
                            type="range"
                            id="progressBar"
                            value="0"
                            min="0"
                            max="100">

                        <span id="duration">0:00</span>

                    </div>

                    <div class="volume">

                        🔊

                        <input
                            type="range"
                            id="volume"
                            min="0"
                            max="100"
                            value="50">

                    </div>

                </div>

            </div>

        <audio id="bgMusic" loop>

            <source
                src="/music.mp3"
                type="audio/mpeg">

        </audio>
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
            if (res.statusCode >= 400) {
                console.log("⚠️ Ping fail:", res.statusCode);
            }
        }).on("error", err => {
            console.log("❌ Lỗi Duy Trì Kết Nối:", err.message);
        });

    }, 4 * 60 * 1000);

};
