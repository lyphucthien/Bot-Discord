    const express = require("express");
    const si = require("systeminformation");
    const http = require("http");
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

        const path = require("path");
        app.use(express.static(path.join(__dirname, "public")));
        app.use(compression());

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

        app.get("/", (req, res) => {

            const online = client.isReady();

            const statusText = online ? "ONLINE" : "OFFLINE";

            res.send(`
        <html>
        <head>
            <link rel="icon" href="/icon-web.png" type="image/png">
            
            <script>
                (() => {
                    const theme = localStorage.getItem("theme") || "dark";
                    document.documentElement.setAttribute("data-theme", theme);
                })();
            </script>

                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <title>Bot Dashboard - Xem Trạng Thái Bot Discord Của Bot Lâm Đồng</title>
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
        padding: 14px 16px;
        margin-bottom: 10px;
        border-radius: 12px;
        cursor: pointer;
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.1);
        transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 15px;
        font-weight: 500;
        position: relative;
        overflow: hidden;
    }

    .menu-item::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
        transition: left 0.5s;
    }

    .menu-item:hover::before {
        left: 100%;
    }

    .menu-item:hover{
        transform: translateX(10px) scale(1.02);
        background: rgba(59,130,246,.2);
        border-color: rgba(59,130,246,.4);
        box-shadow: 0 8px 20px rgba(59,130,246,.2);
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

        width:54px;
        height:54px;

        border:1.5px solid var(--border);
        border-radius:18px;

        cursor:pointer;

        font-size:28px;

        background:var(--card);
        color:var(--text);
        backdrop-filter: blur(15px);
        box-shadow: 0 8px 20px rgba(0,0,0,.3), inset 0 0 15px rgba(255,255,255,.05);

        transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);

        z-index:10001;
    }

    #menuBtn:hover{
        transform:scale(1.1) rotate(5deg);
        box-shadow: 0 12px 30px rgba(59,130,246,.3), inset 0 0 15px rgba(255,255,255,.1);
        border-color: rgba(59,130,246,.4);
    }

    #menuBtn:active {
        transform: scale(0.95);
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
        backdrop-filter:blur(25px);

        border-right:1.5px solid var(--border);

        transition:left .4s cubic-bezier(0.4, 0, 0.2, 1);

        z-index:9999;

        display:flex;
        flex-direction:column;

        box-shadow: 15px 0 50px rgba(0,0,0,.4);
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

        padding:20px;
        padding-right:15px;

        font-size:15px;
        opacity:.95;
        
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;

    }

    .menu-content::-webkit-scrollbar {
        width: 6px;
    }

    .menu-content::-webkit-scrollbar-track {
        background: rgba(255,255,255,.05);
        border-radius: 10px;
    }

    .menu-content::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,.2);
        border-radius: 10px;
        transition: all 0.3s ease;
    }

    .menu-content::-webkit-scrollbar-thumb:hover {
        background: rgba(59,130,246,.4);
    }

    .top-bar{
        width:100%;
        max-width:920px;

        margin: 0 auto 5px;
        box-shadow:var(--shadow);

        display:grid;
        grid-template-columns:repeat(5,1fr);

        background:var(--card);
        backdrop-filter:blur(20px);

        border:1.5px solid var(--border);
        border-radius:24px;

        overflow:hidden;
        position: relative;
        animation: slideInDown 0.6s ease-out;
    }

    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .top-bar::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,.08) 0%, transparent 100%);
        pointer-events: none;
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

        background:rgba(0,0,0,.7);
        backdrop-filter:blur(12px);

        z-index:10005;
        animation: fadeInBackdrop .3s ease;

    }

    @keyframes fadeInBackdrop {
        from { opacity: 0; backdrop-filter: blur(0px); }
        to { opacity: 1; backdrop-filter: blur(12px); }
    }

    .modal.show{

        display:flex;

        animation:fadeIn .35s cubic-bezier(0.4, 0, 0.2, 1);

    }

    @keyframes fadeIn{

        from{
            opacity:0;
            transform:scale(.92) translateY(-20px);
        }

        to{
            opacity:1;
            transform:scale(1) translateY(0);
        }

    }

    .modal-content{

        width:550px;
        max-width:85%;
        max-height:75vh;

        background:var(--card);
        backdrop-filter: blur(25px);

        border:1.5px solid var(--border);

        border-radius:24px;

        padding:32px;
        box-shadow: 0 25px 60px rgba(0,0,0,.5), var(--shadow-neon);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;

    }

    .modal-content::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, transparent 50%);
        pointer-events: none;
    }

    .modal-header{

        display:flex;
        justify-content:space-between;
        align-items:center;

        margin-bottom:20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,.1);

    }

    .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
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

        --card: rgba(17,24,39,.55);
        --text: #ffffff;
        --border: rgba(255,255,255,.12);
        --stat: rgba(255,255,255,.08);

        --primary: #3b82f6;
        --success: #22c55e;
        --danger: #ef4444;

        --shadow: 0 20px 45px rgba(0,0,0,.45);
        --shadow-glow: 0 0 20px rgba(59,130,246,.3);
        --shadow-neon: 0 0 30px rgba(102,126,234,.4), 0 0 60px rgba(118,75,162,.2);
        
        --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --gradient-success: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        --gradient-neon: linear-gradient(135deg, #00d4ff 0%, #667eea 50%, #764ba2 100%);
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

        background: radial-gradient(circle at top left,#1e3a8a 0%,transparent 35%), radial-gradient(circle at bottom right,#6d28d9 0%,transparent 35%),
        radial-gradient(circle at center,#0f172a 0%, transparent 50%),
        linear-gradient(135deg, var(--bg), var(--bg2));

        background-size: 400% 400%, 400% 400%, 100% 100%, 100% 100%;
        animation: gradient 20s ease infinite;

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
        background-image: 
            radial-gradient(circle at top right, rgba(102, 126, 234, 0.15), transparent 50%),
            radial-gradient(circle at bottom left, rgba(118, 75, 162, 0.15), transparent 50%);
        backdrop-filter:blur(20px);
        border:1.5px solid var(--border);
        border-radius:24px;
        padding:32px;
        box-shadow: var(--shadow), var(--shadow-neon);
        position: relative;
        overflow: hidden;

        transition: all .35s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideInUp 0.6s ease-out;
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, transparent 50%);
        pointer-events: none;
        border-radius: 24px;
    }

    .card:hover{
        transform: translateY(-12px) scale(1.02);
        border-color: rgba(59,130,246,.5);
        box-shadow: 0 30px 60px rgba(59,130,246,.25), var(--shadow-neon);
        backdrop-filter: blur(25px);
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
        box-shadow:var(--shadow), var(--shadow-neon);
        border:1.5px solid var(--border);
        border-radius:24px;
        padding:24px;
        position: relative;
        overflow: hidden;

        transition: all .35s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideInUp 0.6s ease-out;
    }

    .chart-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, transparent 50%);
        pointer-events: none;
        border-radius: 24px;
    }

    .chart-card:hover{
        transform: translateY(-10px) scale(1.02);
        box-shadow: 0 30px 60px rgba(59,130,246,.25), var(--shadow-neon);
        backdrop-filter: blur(30px);
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
        box-shadow:0 0 15px #22c55e, inset 0 0 8px rgba(255,255,255,.3);
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
        box-shadow:0 0 15px #ef4444, inset 0 0 8px rgba(255,255,255,.2);
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
        transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        display:flex;
        justify-content:space-between;
        align-items: center;

        padding:16px 18px;
        margin:12px 0;

        background:var(--stat);
        border:1px solid rgba(255,255,255,.08);
        border-radius:14px;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
    }

    .stat::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
        transition: left 0.5s;
    }

    .stat:hover::before {
        left: 100%;
    }

    .stat:hover {
        transform: translateY(-4px) scale(1.03);
        background: rgba(255,255,255,.12);
        border-color: rgba(59,130,246,.3);
        box-shadow: 0 12px 30px rgba(59,130,246,.2), inset 0 0 20px rgba(59,130,246,.05);
    }
    
    #themeBtn{
        position:fixed;
        top:20px;
        right:20px;

        padding:13px 22px;

        border:1.5px solid rgba(59,130,246,.3);
        border-radius:16px;

        cursor:pointer;

        font-size:14px;
        font-weight:600;
        letter-spacing: 0.5px;

        background: linear-gradient(
            135deg,
            var(--primary),
            color-mix(in srgb, var(--primary) 60%, white)
        );
        color: white;
        backdrop-filter: blur(10px);

        box-shadow: 0 10px 25px rgba(37,99,235,.4), 0 0 20px rgba(37,99,235,.2), inset 0 0 20px rgba(255,255,255,.1);

        transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #themeBtn:hover{
        transform: translateY(-5px) scale(1.08);
        box-shadow: 0 20px 40px rgba(37,99,235,.5), 0 0 40px rgba(37,99,235,.3), inset 0 0 20px rgba(255,255,255,.15);
        border-color: rgba(59,130,246,.6);
        backdrop-filter: blur(15px);
    }

    #themeBtn:active{
        transform: translateY(-2px) scale(0.98);
        box-shadow: 0 5px 15px rgba(37,99,235,.3), inset 0 0 20px rgba(255,255,255,.1);
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
        font-weight: 700;
        transition: all 0.3s ease;
        text-shadow: 0 0 10px rgba(34,197,94,.3);
    }

    .warning {
        color: #f59e0b;
        font-weight: 700;
        transition: all 0.3s ease;
        text-shadow: 0 0 10px rgba(245,158,11,.3);
    }

    .danger {
        color: #ef4444;
        font-weight: 700;
        animation: blink 1s infinite, glow 1.2s infinite;
        text-shadow: 0 0 10px rgba(239,68,68,.5);
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
        margin:20px 0;
        padding: 12px;
        background: rgba(255,255,255,.06);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.1);
        transition: all .3s ease;
    }

    .setting-row:hover {
        background: rgba(255,255,255,.1);
        border-color: rgba(59,130,246,.3);
    }

    .setting-row label{
        font-weight:600;
        font-size: 15px;
    }

    .setting-row select{
        padding:10px 12px;
        border-radius:10px;
        background:rgba(255,255,255,.08);
        color:var(--text);
        border:1px solid rgba(255,255,255,.2);
        transition: all .3s ease;
        cursor: pointer;
    }

    .setting-row select:hover, .setting-row select:focus {
        background: rgba(255,255,255,.12);
        border-color: rgba(59,130,246,.4);
        box-shadow: 0 0 15px rgba(59,130,246,.2);
    }

    .setting-row input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: var(--primary);
    }

    .setting-row input[type="color"]{
        width:50px;
        height:40px;
        border:1px solid rgba(255,255,255,.2);
        background:none;
        cursor:pointer;
        border-radius: 10px;
        transition: all .3s ease;
    }

    .setting-row input[type="color"]:hover {
        border-color: rgba(59,130,246,.4);
        box-shadow: 0 0 15px rgba(59,130,246,.2);
    }

    .bot-info-table {
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 14px;
        padding: 16px;
        margin: 12px 0;
        font-size: 14px;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,.05);
        transition: all 0.3s ease;
    }

    .info-row:last-child {
        border-bottom: none;
    }

    .info-row:hover {
        background: rgba(255,255,255,.05);
        padding-left: 8px;
        padding-right: 8px;
        border-radius: 6px;
    }

    .info-label {
        font-weight: 600;
        color: rgba(255,255,255,.7);
        min-width: 80px;
    }

    .info-value {
        font-weight: 700;
        color: var(--primary);
        text-align: right;
        flex: 1;
        margin-left: 10px;
        font-family: 'Courier New', monospace;
    }

    #saveSettings{
        margin-top:20px;
        width:100%;
        padding:15px;

        border:1.5px solid rgba(59,130,246,.3);
        border-radius:14px;
        cursor:pointer;
        font-size:15px;
        font-weight:600;
        letter-spacing: 0.5px;

        background: linear-gradient(
            135deg,
            var(--primary),
            color-mix(in srgb, var(--primary) 60%, white)
        );
        color: white;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 20px rgba(59,130,246,.3), inset 0 0 15px rgba(255,255,255,.1);
        transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #saveSettings:hover{
        transform:translateY(-3px);
        box-shadow: 0 15px 35px rgba(59,130,246,.4), inset 0 0 15px rgba(255,255,255,.15);
        border-color: rgba(59,130,246,.6);
    }

    #saveSettings:active {
        transform: translateY(-1px);
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
        bottom:25px;
        transform:translateX(-50%);

        width:420px;
        max-width:88%;
        display:flex;
        gap:12px;
        padding:14px;

        border-radius:18px;
        background:var(--card);
        border:1.5px solid var(--border);
        backdrop-filter:blur(25px);
        box-shadow:var(--shadow), var(--shadow-neon);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index:9998;
        animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    .music-player::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, transparent 50%);
        pointer-events: none;
        border-radius: 22px;
    }

    .music-player:hover {
        transform: translateX(-50%) translateY(-5px);
        box-shadow: var(--shadow), 0 0 40px rgba(102,126,234,.3);
        backdrop-filter: blur(30px);
    }

    .cover{
        width:70px;
        height:70px;

        border-radius:10px;
        object-fit:cover;
        flex-shrink: 0;
    }

    .player-body{
        flex:1;
    }

    .song-title{
        font-size:15px;
        font-weight:700;
        line-height: 1.3;
    }

    .artist{
        opacity:.7;
        margin-bottom:8px;
        font-size: 13px;
    }

    .controls{
        display:flex;
        justify-content:center;
        gap:10px;
        margin:10px 0;
    }

    .controls button{
        width:36px;
        height:36px;

        border:1px solid rgba(255,255,255,.2);
        border-radius:50%;

        background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white));
        color:white;
        cursor:pointer;
        font-weight: 600;
        font-size: 12px;
        transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 5px 15px rgba(59,130,246,.2);
    }

    .controls button:hover {
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 10px 25px rgba(59,130,246,.4);
        border-color: rgba(255,255,255,.4);
    }

    .controls button:active {
        transform: scale(0.95);
    }

    .progress{
        display:flex;
        align-items:center;
        gap:8px;
        font-size: 12px;
    }

    .progress input{
        flex:1;
    }

    .volume{
        display:flex;
        align-items:center;
        gap:8px;
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

    body.menu-open .card,
    body.menu-open .chart-card,
    body.menu-open .top-bar,
    body.menu-open .music-player {
        filter: blur(6px);
        pointer-events: none;
        user-select: none;
    }

    input[type="range"] {
        height: 5px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255,255,255,.2);
        border-radius: 5px;
        outline: none;
        cursor: pointer;
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary);
        cursor: pointer;
        box-shadow: 0 0 8px rgba(59,130,246,.4);
        transition: all 0.2s ease;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
        width: 16px;
        height: 16px;
        box-shadow: 0 0 12px rgba(59,130,246,.6);
    }

    input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary);
        cursor: pointer;
        border: none;
        box-shadow: 0 0 8px rgba(59,130,246,.4);
        transition: all 0.2s ease;
    }

    input[type="range"]::-moz-range-thumb:hover {
        width: 16px;
        height: 16px;
        box-shadow: 0 0 12px rgba(59,130,246,.6);
    }

    input[type="range"]::-moz-range-track {
        background: transparent;
        border: none;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 90vw;
            max-width: 95%;
            padding: 24px;
            max-height: 80vh;
        }

        .menu-content {
            padding: 16px;
            padding-right: 12px;
            font-size: 14px;
        }

        .setting-row {
            margin: 16px 0;
            padding: 10px;
        }

        .bot-info-table {
            padding: 12px;
            margin: 10px 0;
        }

        .info-row {
            padding: 8px 0;
            font-size: 13px;
        }

        .music-player {
            width: 380px;
            max-width: 85%;
            padding: 12px;
            gap: 10px;
        }

        .cover {
            width: 60px;
            height: 60px;
        }

        .song-title {
            font-size: 14px;
        }

        .artist {
            font-size: 12px;
            margin-bottom: 6px;
        }

        .controls button {
            width: 32px;
            height: 32px;
            font-size: 11px;
        }
    }

    @media (max-width: 480px) {
        .modal-content {
            width: 95vw;
            max-width: 98%;
            padding: 18px;
            max-height: 85vh;
        }

        .modal-header h2 {
            font-size: 16px;
        }

        .menu-content {
            padding: 12px;
            padding-right: 8px;
            font-size: 13px;
        }

        .setting-row {
            margin: 12px 0;
            padding: 8px;
            font-size: 12px;
        }

        .setting-row label {
            font-size: 12px;
        }

        .bot-info-table {
            padding: 10px;
            margin: 8px 0;
        }

        .info-row {
            padding: 6px 0;
            font-size: 12px;
        }

        .info-label {
            min-width: 60px;
            font-size: 11px;
        }

        .info-value {
            font-size: 11px;
        }

        #saveSettings {
            padding: 12px;
            font-size: 13px;
            margin-top: 16px;
        }

        .music-player {
            width: 320px;
            max-width: 80%;
            padding: 10px;
            gap: 8px;
            bottom: 20px;
        }

        .cover {
            width: 50px;
            height: 50px;
        }

        .song-title {
            font-size: 13px;
        }

        .artist {
            font-size: 11px;
            margin-bottom: 4px;
        }

        .controls button {
            width: 30px;
            height: 30px;
            font-size: 10px;
        }

        .progress {
            font-size: 11px;
            gap: 6px;
        }

        .volume {
            font-size: 11px;
        }
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

                    <div class="menu-item" onclick="openLink('https://www.roblox.com/share?code=36bb76fc1fa42c4e8c991dfa320f7f2a&type=Profile&source=ProfileShare&stamp=1782844958068')">
                        🎮 Acc Roblox
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

                        <hr>

                        <h3>🤖 Bot Info</h3>

                        <div class="bot-info-table">
                            <div class="info-row">
                                <span class="info-label">Tên Bot:</span>
                                <span class="info-value" id="botName">Lâm Đồng</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Ping:</span>
                                <span class="info-value" id="botPing">-</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Máy Chủ:</span>
                                <span class="info-value" id="botServers">-</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">RAM:</span>
                                <span class="info-value" id="botRam">-</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">CPU:</span>
                                <span class="info-value" id="botCpu">-</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Uptime:</span>
                                <span class="info-value" id="botUptime">-</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Trạng Thái:</span>
                                <span class="info-value" id="botStatus">-</span>
                            </div>
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
                    document.addEventListener("visibilitychange", () => {
                        socket.emit("visibility", document.visibilityState === "visible");
                    });
                    socket.emit("visibility", document.visibilityState === "visible");

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
                        title: "WILDFIRE",
                        artist: "Jessie Villa",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Wildfire.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Wildfire.jpg"
                    },
                    {
                        title: "Một Nửa Sự Thật",
                        artist: "24K.RIGHT",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Một%20Nửa%20Sự%20Thật.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Một%20Nửa%20Sự%20Thật.jpg"
                    },
                    {
                        title: "Buông Bỏ Sự Phụ Thuộc Nơi Anh",
                        artist: "Vương Diễm Vi",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Buông%20Bỏ%20Sự%20Phụ%20Thuộc%20Nơi%20Anh.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Buông%20Bỏ%20Sự%20Phụ%20Thuộc%20Nơi%20Anh.jpg"
                    },
                    {
                        title: "Ngủ Sớm Đi Em",
                        artist: "DucMinh",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Ngủ%20Sớm%20Đi%20Em.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Ngủ%20Sớm%20Đi%20Em.jpg"
                    },
                    {
                        title: "Anh Biết",
                        artist: "Xám, D Blue",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Anh%20Biết.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Anh%20Biết.jpg"
                    },
                    {
                        title: "Sao Em Lại Tắt Máy?",
                        artist: "Phạm Nguyên Ngọc, VAnh, BMZ",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Sao%20Em%20Lại%20Tắt%20Máy.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Sao%20Em%20Lại%20Tắt%20Máy.jpg"
                    },
                    {
                        title: "Đừng Nghe Máy",
                        artist: "SIVAN",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Đừng%20Nghe%20Máy.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Đừng%20Nghe%20Máy.jpg"
                    },
                    {
                        title: "Dù Có Cách Xa",
                        artist: "Đinh Mạnh Ninh",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Dù%20Có%20Cách%20Xa.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Dù%20Có%20Cách%20Xa.jpg"
                    },

                    {
                        title: "Để Dành Khi Thức Giấc",
                        artist: "SIVAN",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Để%20Dành%20Khi%20Thức%20Giấc.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Để%20Dành%20Khi%20Thức%20Giấc.jpg"
                    },
                    {
                        title: "Vệt Nắng Nhạt Phai (Piano Version)",
                        artist: "Kai, Xưa Lâm, LIKIE",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Vệt%20Nắng%20Nhạt%20Phai%20(Piano%20Version).mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Vệt%20Nắng%20Nhạt%20Phai%20(Piano%20Version).jpg"
                    },
                    {
                        title: "Già Cùng Nhau Là Được",
                        artist: "Tùng TeA, PC, TaynguyenSound",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Già%20Cùng%20Nhau%20Là%20Được.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Già%20Cùng%20Nhau%20Là%20Được.jpg"
                    },
                    {
                        title: "Feel At Home",
                        artist: "B Ray",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Feel%20At%20Home.mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Feel%20At%20Home.jpg"
                    },
                    {
                        title: "Bản Nhạc Cuối (Cho Em)",
                        artist: "B Ray",
                        src: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Bản%20Nhạc%20Cuối%20(Cho%20Em).mp3",
                        cover: "https://raw.githubusercontent.com/lyphucthien/pictuces-music/main/Bản%20Nhạc%20Cuối%20(Cho%20Em).jpg"
                    },
                ];

                let currentSong = 0;
                let isShuffle = false;
                let isRepeat = false;
                let audio;

                const MUSIC_KEY = "dashboardMusic";

                function saveMusicState() {
                    if (!audio) return;

                    localStorage.setItem(
                        MUSIC_KEY,
                        JSON.stringify({
                            song: currentSong,
                            time: audio.currentTime,
                            volume: audio.volume,
                            shuffle: isShuffle,
                            repeat: isRepeat
                        })
                    );
                }

                function loadMusicState() {
                    const saved = localStorage.getItem(MUSIC_KEY);
                    if (!saved) return;

                    try {

                        const data = JSON.parse(saved);

                        currentSong = data.song ?? 0;

                        isShuffle = data.shuffle ?? false;
                        isRepeat = data.repeat ?? false;

                        audio.volume = data.volume ?? 0.5;
                        loadTrack(currentSong);

                        audio.onloadedmetadata = () => {
                            audio.currentTime = data.time ?? 0;
                        };

                        document.getElementById("volume").value =
                            (audio.volume * 100);

                        audio.loop = isRepeat;

                        document.getElementById("shuffleBtn").style.opacity =
                            isShuffle ? "1" : "0.4";

                        document.getElementById("repeatBtn").style.opacity =
                            isRepeat ? "1" : "0.4";

                    } catch (e) {
                        console.error(e);

                    }

                }

                function loadTrack(index) {
                    const song = playlist[index];
                    if (!song || !audio) return;

                    document.getElementById("songTitle").innerText = song.title;
                    document.getElementById("artist").innerText = song.artist;
                    document.getElementById("cover").src = song.cover;

                    audio.src = song.src;
                    audio.load();

                    const progressBar = document.getElementById("progressBar");
                    const currentTime = document.getElementById("currentTime");
                    const duration = document.getElementById("duration");

                    progressBar.value = 0;
                    currentTime.innerText = "0:00";
                    duration.innerText = "0:00";

                    audio.onloadedmetadata = () => {
                        duration.innerText = formatTime(audio.duration);
                    };
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

                    // Update Bot Info Table
                    const botName = document.getElementById("botName");
                    const botPing = document.getElementById("botPing");
                    const botServers = document.getElementById("botServers");
                    const botRam = document.getElementById("botRam");
                    const botCpu = document.getElementById("botCpu");
                    const botUptime = document.getElementById("botUptime");
                    const botStatus = document.getElementById("botStatus");

                    if (botName) botName.textContent = data.botName || "Discord Bot";
                    if (botPing) botPing.textContent = data.ping + " ms";
                    if (botServers) botServers.textContent = data.guilds || "0";
                    if (botRam) botRam.textContent = data.ram + " MB";
                    if (botCpu) botCpu.textContent = data.cpu + " %";
                    if (botUptime) botUptime.textContent = data.uptime || "-";
                    if (botStatus) {
                        botStatus.textContent = data.online ? "🟢 Online" : "🔴 Offline";
                        botStatus.style.color = data.online ? "#22c55e" : "#ef4444";
                    }
                });

                function formatTime(sec){
                    const m = Math.floor(sec / 60);
                    const s = Math.floor(sec % 60);
                    return m + ":" + String(s).padStart(2,"0");
                }

                document.addEventListener("DOMContentLoaded", () => {
                    const themeBtn = document.getElementById("themeBtn");
                    const settingsBtn = document.getElementById("settingsBtn");
                    const settingsModal = document.getElementById("settingsModal");

                    const modal = document.getElementById("uptimeModal");
                    const closeBtn = document.getElementById("closeModal");
                    const uptimeBtn = document.getElementById("uptimeStat");

                    const menuBtn = document.getElementById("menuBtn");
                    const sideMenu = document.getElementById("sideMenu");
                    const menuOverlay = document.getElementById("menuOverlay");
                    const closeMenu = document.getElementById("closeMenu");

                    menuBtn.addEventListener("click", () => {
                        document.body.classList.add("menu-open");

                        sideMenu.classList.add("show");
                        menuOverlay.classList.add("show");

                        menuBtn.style.opacity = "0";
                        menuBtn.style.transform = "scale(.8)";
                        menuBtn.style.pointerEvents = "none";
                    });

                    function closeSideMenu() {
                        document.body.classList.remove("menu-open");

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
                    const playBtn = document.getElementById("playMusic");
                    const volume = document.getElementById("volume");

                    const progressBar = document.getElementById("progressBar");
                    const currentTime = document.getElementById("currentTime");
                    const duration = document.getElementById("duration");

                    audio.ontimeupdate = ()=>{
                        if(!audio.duration) return;

                        progressBar.value =
                            audio.currentTime / audio.duration * 100;

                        currentTime.innerText =
                            formatTime(audio.currentTime);

                        saveMusicState();
                    };

                    progressBar.oninput = ()=>{
                        audio.currentTime =
                            progressBar.value / 100 * audio.duration;

                        saveMusicState();
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
                        saveMusicState();
                    };

                    document.getElementById("nextBtn").onclick = () => {
                        currentSong++;

                        if (currentSong >= playlist.length) {
                            currentSong = 0;
                        }

                        loadTrack(currentSong);

                        audio.play();
                        playBtn.innerHTML = "⏸";
                        saveMusicState();
                    };

                    document.getElementById("prevBtn").onclick = () => {
                        currentSong--;

                        if (currentSong < 0) {
                            currentSong = playlist.length - 1;
                        }

                        loadTrack(currentSong);
                        audio.play();
                        playBtn.innerHTML = "⏸";
                        saveMusicState();
                    };

                    document.getElementById("shuffleBtn").onclick = () => {
                        isShuffle = !isShuffle;

                        document.getElementById("shuffleBtn").style.opacity =
                            isShuffle ? "1" : "0.4";

                        saveMusicState();
                    };

                    document.getElementById("repeatBtn").onclick = () => {
                        isRepeat = !isRepeat;

                        audio.loop = isRepeat;

                        document.getElementById("repeatBtn").style.opacity =
                            isRepeat ? "1" : "0.4";

                        saveMusicState();
                    };

                    volume.oninput = () => {
                        audio.volume = volume.value / 100;

                        saveMusicState();
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
                        saveMusicState();
                    };

                    loadMusicState();
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

                }

                document.addEventListener("DOMContentLoaded", () => {
                    const saved = localStorage.getItem("theme") || "dark";
                    setTheme(saved);
                    applySettings();
                    updateThemeButton();
                });

                function updateThemeButton(){
                    const themeBtn=document.getElementById("themeBtn");
                    if(!themeBtn) return;

                    const theme=document.documentElement.getAttribute("data-theme");

                    const map={
                        dark:"🌙 Dark",
                        light:"☀️ Light",
                        oled:"⚫ OLED"
                    };

                    themeBtn.textContent=map[theme] ?? "🌙 Dark";
                }

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
                        class="cover">

                    <div class="player-body">

                        <div class="song-title" id="songTitle">
                            Không Biết
                        </div>

                        <div class="artist" id="artist">
                            Lý Phúc Thiện
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

            <audio id="bgMusic"></audio>

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
        
        // Error handling cho Socket.IO
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

        const https = require("https");

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
