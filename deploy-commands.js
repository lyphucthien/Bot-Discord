const { REST, Routes } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const commands = [];
console.log(process.env.TOKEN);

const commandFiles = fs
    .readdirSync('./commands')
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {

    try {

        const command = require(`./commands/${file}`);

        console.log(`✅ ${file} -> ${command.data?.name}`);

        if (!command.data) continue;

        commands.push(
            command.data.toJSON()
        );

    } catch (err) {

        console.log(
            `❌ Lỗi File ${file}`
        );

        console.error(err);

    }

}

const rest = new REST({
    version: '10'
}).setToken(process.env.TOKEN);

(async () => {

    try {

        console.log(
            `🔄 Đang đăng ký ${commands.length} slash commands...`
        );

        await rest.put(
            Routes.applicationCommands(
                '1503725254386909194'
            ),
            {
                body: commands
            }
        );

        console.log(
            '✅ Đăng ký slash commands thành công'
        );

    } catch (error) {

        console.error(error);

    }

})();
