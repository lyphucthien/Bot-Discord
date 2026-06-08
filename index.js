const {
    Client,
    GatewayIntentBits,
    Collection
} = require('discord.js');

const fs = require('fs');
const config = require('./config.json');
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {

    const online = client.isReady();

    const statusIcon = online ? "🟢" : "🔴";
    const statusText = online ? "ONLINE" : "OFFLINE";

    res.send(`
    <html>
    <head>
        <title>Bot Lâm Đồng</title>
        <style>
            body{background:#0f172a;color:white;font-family:Arial;text-align:center;padding-top:100px;}

            .card{background:#1e293b;width:500px;margin:auto;padding:30px;border-radius:15px;}

            .status{font-size:32px;font-weight:bold;margin:20px 0;}

            .info{margin-top:10px;font-size:18px;}
        </style>
    </head>
    <body>

        <div class="card">

            <h1>🤖 Bot Lâm Đồng 🤖</h1>

            <div class="status">
                ${statusIcon} ${statusText}
            </div>

            <div class="info">
                ⚡ Ping: ${online ? client.ws.ping + "ms" : "N/A"}
            </div>

            <div class="info">
                🏠 Servers: ${online ? client.guilds.cache.size : 0}
            </div>

            <div class="info">
                👥 Users: ${online ? client.users.cache.size : 0}
            </div>

            <div class="info">
                🕒 Uptime: ${Math.floor(process.uptime() / 60)} phút
            </div>

        </div>

    </body>
    </html>
    `);
});

app.get("/status", (req, res) => {
    res.json({
        online: true,
        bot: client.user ? client.user.tag : "Đang khởi động...",
        guilds: client.isReady() ? client.guilds.cache.size : 0,
        users: client.isReady() ? client.users.cache.size : 0,
        uptime: Math.floor(process.uptime())
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Web server chạy ở cổng ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

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
    console.log(`✅ ${client.user.tag} đã online!`);
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
                content: '❌ Không tìm thấy role.',
                flags: 64
            });
        }

        await interaction.member.roles.add(role);

        await interaction.reply({
            content: '✅ Xác minh thành công!',
            flags: 64
        });
    }

});

client.login(process.env.TOKEN);
