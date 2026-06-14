const levelDB = require('../utils/levelDB');

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

        const xp = Math.floor(Math.random() * 11) + 10;

        const user = levelDB.get(message.author.id);

        let currentXP = user.xp + xp;
        let currentLevel = user.level;

        while (currentXP >= xpFor(currentLevel + 1)) {

            currentXP -= xpFor(currentLevel + 1);
            currentLevel++;

            message.channel.send(
                `🎉 ${message.author} Lên **Level ${currentLevel}**`
            );
        }

        levelDB.update(
            message.author.id,
            currentXP,
            currentLevel
        );

    });

};