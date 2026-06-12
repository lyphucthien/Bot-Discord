const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, '../data/levels.json');

const cooldowns = new Map();

module.exports = (client) => {

    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const userId = message.author.id;
        const key = `${message.guild.id}-${userId}`;

        if (cooldowns.has(key)) return;

        cooldowns.set(key, true);
        setTimeout(() => cooldowns.delete(key), 5000);

        let levels = {};

        if (fs.existsSync(levelFile)) {
            try {
                const data = fs.readFileSync(levelFile, 'utf8');
                levels = data ? JSON.parse(data) : {};
            } catch (err) {
                console.error("Lỗi đọc levels.json:", err);
                levels = {};
            }
        }

        if (!levels[userId]) {
            levels[userId] = {
                xp: 0,
                level: 1
            };
        }

        const gainedXP = Math.floor(Math.random() * 15) + 5;

        levels[userId].xp += gainedXP;

        const neededXP = levels[userId].level * 100;

        if (levels[userId].xp >= neededXP) {
            levels[userId].xp -= neededXP;
            levels[userId].level++;

            message.channel.send(
                `🎉 ${message.author} đã lên **Level ${levels[userId].level}**!`
            );
        }

        fs.writeFileSync(levelFile, JSON.stringify(levels, null, 2));
    });
};
