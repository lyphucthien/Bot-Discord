const fs = require('fs');
const levelFile = require('../utils/levelFile');

const cooldowns = new Map();

function xpFor(level) {
    return level * level * 100;
}

module.exports = (client) => {

    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const key = `${message.guild.id}-${message.author.id}`;

        if (cooldowns.has(key)) return;

        cooldowns.set(key, true);
        setTimeout(() => cooldowns.delete(key), 5000);

        let levels = {};

        if (fs.existsSync(levelFile)) {
            try {
                levels = JSON.parse(fs.readFileSync(levelFile, 'utf8'));
            } catch {
                levels = {};
            }
        }

        const userId = message.author.id;

        if (!levels[userId]) {
            levels[userId] = { xp: 0, level: 1 };
        }

        const xp = Math.floor(Math.random() * 11) + 10;

        levels[userId].xp += xp;

        while (levels[userId].xp >= xpFor(levels[userId].level + 1)) {
            levels[userId].xp -= xpFor(levels[userId].level + 1);
            levels[userId].level++;

            message.channel.send(
                `🎉 ${message.author} Đã Lên **Level ${levels[userId].level}**!`
            );
        }

        fs.writeFileSync(levelFile, JSON.stringify(levels, null, 2));
    });
};