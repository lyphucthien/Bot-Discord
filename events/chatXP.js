const cooldowns = new Set();
const fs = require('fs');
const path = require('path');

const levelFile = path.join(
    __dirname,
    '../data/levels.json'
);

function xpFor(level) {
    if (level <= 0) return 0;
    return level * level * 100;
}

module.exports = (client) => {

    client.on('messageCreate'), async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const key = `${message.guild.id}-${message.author.id}`;

        if (cooldowns.has(key)) return;

        cooldowns.add(key);

        setTimeout(() => {
            cooldowns.delete(key);
        }, 20000);

        const xp = Math.floor(Math.random() * 11) + 10;

        // add xp database
        let levels = {};

        if (fs.existsSync(levelFile)) {
            levels = JSON.parse(
                fs.readFileSync(levelFile, 'utf8')
            );
        }

        const userId = message.author.id;

        if (!levels[userId]) {
            levels[userId] = {
                xp: 0,
                level: 1
            };
        }

        levels[userId].xp += xp;

        while (
            levels[userId].xp >=
            xpFor(levels[userId].level + 1)
        ) {
            levels[userId].level++;
        }

        fs.writeFileSync(
            levelFile,
            JSON.stringify(levels, null, 4)
        );
    }
};
