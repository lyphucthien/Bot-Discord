require('./database/sqlite');

const fs = require("fs");
const config = require("./config.json");

const { Client, GatewayIntentBits, Collection } = require("discord.js");

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

// Khởi động Web Dashboard
require("./web/webServer")(client);

client.commands = new Collection();

// Load Events
const eventFiles = fs.readdirSync("./events").filter(f => f.endsWith(".js"));

for (const file of eventFiles) {
    require(`./events/${file}`)(client);
}

// Load Commands
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {

    const command = require(`./commands/${file}`);

    console.log(`✅ Loaded Command: ${command.data.name}`);

    client.commands.set(command.data.name, command);
}

client.login(process.env.TOKEN);

client.on("error", console.error);
