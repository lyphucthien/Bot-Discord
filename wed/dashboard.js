module.exports = (app, client) => {

    function formatUptime(u) {
        return `${u.days}d ${u.hours}h ${u.minutes}m`;
    }

    app.get("/", (req, res) => {
        res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Bot Dashboard</title>
<style>
body{
    margin:0;
    font-family:Arial;
    background:#0f172a;
    color:white;
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
}
.card{
    width:500px;
    padding:20px;
    background:rgba(255,255,255,0.05);
    border-radius:15px;
}
.row{
    display:flex;
    justify-content:space-between;
    margin:10px 0;
}
</style>
</head>

<body>

<div class="card">
    <h2>🤖 ${client.user?.username || "Bot"}</h2>

    <div class="row"><span>Status</span><span id="status">Loading...</span></div>
    <div class="row"><span>Ping</span><span id="ping"></span></div>
    <div class="row"><span>RAM</span><span id="ram"></span></div>
    <div class="row"><span>Guilds</span><span id="guilds"></span></div>
    <div class="row"><span>Users</span><span id="users"></span></div>
    <div class="row"><span>Time</span><span id="time"></span></div>
    <div class="row"><span>Uptime</span><span id="uptime"></span></div>
</div>

<script>
async function load(){
    const res = await fetch('/status');
    const data = await res.json();

    document.getElementById("status").innerText = data.online ? "🟢 ONLINE" : "🔴 OFFLINE";
    document.getElementById("ping").innerText = data.ping + "ms";
    document.getElementById("ram").innerText = data.ram + " MB";
    document.getElementById("guilds").innerText = data.guilds;
    document.getElementById("users").innerText = data.users;
    document.getElementById("time").innerText = data.time;
    document.getElementById("uptime").innerText =
        data.uptime.days + "d " + data.uptime.hours + "h " + data.uptime.minutes + "m";
}

load();
setInterval(load, 2000);
</script>

</body>
</html>
        `);
    });
};