const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
console.log("FILE EXISTS:", fs.existsSync("./web/webServer.js"));
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

require("./web/webServer.js")(client);

const URL = "https://my-discord-bot-mfu0.onrender.com";

setInterval(async () => {
    try {
        await fetch(`${URL}/ping`);
        console.log("🔄 Đã Gửi Tín Hiệu Giữ Kết Nối");
    } catch (err) {
        console.log("❌ Ping failed");
    }
}, 4 * 60 * 1000);

client.commands = new Collection();

// LOAD EVENT
const eventFiles = fs
    .readdirSync('./events')
    .filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        event(client);
    } catch (err) {
        console.log(`❌ Event Lỗi: ${file}`, err);
    }
}

// LOAD COMMANDS
const commandFiles = fs
    .readdirSync('./commands')
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);

        if (command?.data?.name) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`⚠️ Command thiếu data.name: ${file}`);
        }

    } catch (err) {
        console.log(`❌ Command Lỗi: ${file}`, err);
    }
}

client.login(process.env.TOKEN);
