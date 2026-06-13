const Level = require('../database/models/Level');

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

        let user = await Level.findOne({ userId: message.author.id });

        if (!user) {
            user = await Level.create({
                userId: message.author.id,
                xp: 0,
                level: 1
            });
        }

        user.xp += xp;

        while (user.xp >= xpFor(user.level + 1)) {
            user.xp -= xpFor(user.level + 1);
            user.level++;

            message.channel.send(
                `🎉 ${message.author} Lên **Level ${user.level}**`
            );
        }

        await user.save();
    });
};
