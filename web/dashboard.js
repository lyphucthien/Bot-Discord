module.exports = (app, client) => {
    function formatUptime() {
        const total = Math.floor(process.uptime());

        const d = Math.floor(total / 86400);
        const h = Math.floor((total % 86400) / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;

        return `${d}d ${h}h ${m}m ${s}s`;
    }
    app.get("/", (req, res) => {

        const online = client.isReady();
        const statusText = online ? "ONLINE" : "OFFLINE";

        res.send(`

    <!DOCTYPE html>
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
        background:linear-gradient(-45deg,#0f172a,#1e293b,#0f172a,#2563eb);
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
    }

    .card:hover{
        transform:translateY(-5px);
        transition:0.3s;
    }

    .status{
        font-size:30px;
        font-weight:bold;
        margin:20px 0;
    }

    .stat{
        display:flex;
        justify-content:space-between;
        padding:12px;
        margin:10px 0;
        background:rgba(255,255,255,0.05);
        border-radius:10px;
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
        box-shadow:0 0 10px #22c55e,0 0 20px #22c55e;
    }

    .offline{
        background:#ef4444;
        box-shadow:0 0 10px #ef4444,0 0 20px #ef4444;
    }
    </style>
    </head>

    <body>

    <div class="card">

        <h1>🤖 ${client.user ? client.user.username : "Bot Dashboard"}</h1>

        <div class="status">
            <span class="dot ${online ? "online" : "offline"}"></span>
            ${statusText}
        </div>

        <div class="stat">
            <span>⚡ Ping</span>
            <span>${online ? client.ws.ping + "ms" : "N/A"}</span>
        </div>

        <div class="stat">
            <span>🏠 Servers</span>
            <span>${online ? client.guilds.cache.size : 0}</span>
        </div>

        <div class="stat">
            <span>👥 Users</span>
            <span>${online ? client.users.cache.size : 0}</span>
        </div>

        <div class="stat">
            <span>💾 RAM</span>
            <span>${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</span>
        </div>

        <div class="stat">
            <span>📅 Time</span>
            <span>${new Date().toLocaleString("vi-VN")}</span>
        </div>

        <div class="stat">
            <span>🕒 Uptime</span>
            <span>${formatUptime()}</span>
        </div>

        <hr style="border:none;height:1px;background:rgba(255,255,255,0.15);margin:20px 0;">

        <div style="opacity:0.7;text-align:center">
            💻 Created By Lý Phúc Thiện
        </div>

    </div>

    </body>
    </html>
        `);
    });

}
