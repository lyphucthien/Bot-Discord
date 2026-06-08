const {
    Client,
    GatewayIntentBits,
    Collection
} = require('discord.js');

const fs = require('fs');
const config = require('./config.json');

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

client.login(process.env.token);
