const Level = require('../database/models/level.js');

const cooldown = new Map();

module.exports = async (message) => {

    const key = `${message.guild.id}-${message.author.id}`;

    if (cooldown.has(key)) return;

    cooldown.set(key, true);
    setTimeout(() => cooldown.delete(key), 5000);

    const xp = Math.floor(Math.random() * 10) + 5;

    let data = await Level.findOne({
        guildId: message.guild.id,
        userId: message.author.id
    });

    if (!data) {
        data = await Level.create({
            guildId: message.guild.id,
            userId: message.author.id
        });
    }

    data.xp += xp;

    const need = data.level * 100;

    if (data.xp >= need) {
        data.xp -= need;
        data.level++;

        message.channel.send(`🎉 ${message.author} lên Level ${data.level}`);
    }

    await data.save();
};