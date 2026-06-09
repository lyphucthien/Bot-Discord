const { Client, GatewayIntentBits, Collection } = require('discord.js');

const fs = require('fs');
const config = require('./config.json');
const express = require("express");
const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});
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
             <span>${Math.floor(process.uptime() / 60)} phút</span>
            </div>

            <hr style="border:none;height:1px;background:rgba(255,255,255,0.1);margin:20px 0;">
            <div style="opacity:.7">
             💻 Created By Lý Phúc Thiện
            </div>

        </div>

    </body>
    </html>
    `);
});

app.get("/status", (req, res) => {
    res.json({
        online: client.isReady(),
        bot: client.user ? client.user.tag : "Đang khởi động...",
        guilds: client.isReady() ? client.guilds.cache.size : 0,
        users: client.isReady() ? client.users.cache.size : 0,
        uptime: Math.floor(process.uptime()),
        ping: client.isReady() ? client.ws.ping : null
    });
});

app.get("/ping", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web Server chạy ở cổng ${PORT}`);
});
const URL = "https://my-discord-bot-mfu0.onrender.com";

setInterval(async () => {
    try {
        await fetch(URL);
        console.log("🔄 Đã Gửi Tín Hiệu Giữ Kết Nối");
    } catch (err) {
        console.log("❌ Ping failed");
    }
}, 5 * 60 * 1000);


client.commands = new Collection();
// Load commands và event
const eventFiles = fs
    .readdirSync('./events')
    .filter(file => file.endsWith('.js'));

for (const file of eventFiles) {

    const event =
        require(`./events/${file}`);

    event(client);
}

const commandFiles = fs
    .readdirSync('./commands')
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('clientReady', () => {
    console.log(`✅ ${client.user.tag} Đã Online`);
});

client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/ +/);

    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        command.execute(message, args);
    } catch (err) {
        console.error(err);
    }
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId === 'verify') {

        const role =
            interaction.guild.roles.cache.get(
                config.verifyRole
            );

        if (!role) {
            return interaction.reply({
                content: '❌ Không Tìm Thấy Vai Trò',
                flags: 64
            });
        }

        await interaction.member.roles.add(role);

        await interaction.reply({
            content: '✅ Xác Minh Thành Công',
            flags: 64
        });
    }

});

client.login(process.env.TOKEN);
