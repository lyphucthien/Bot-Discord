const Level = require('../database/models/Level.js');

module.exports = (client) => {

    setInterval(async () => {

        for (const guild of client.guilds.cache.values()) {
            for (const channel of guild.channels.cache.values()) {

                if (!channel.isVoiceBased()) continue;

                for (const member of channel.members.values()) {

                    let data = await Level.findOne({
                        guildId: guild.id,
                        userId: member.id
                    });

                    if (!data) {
                        data = await Level.create({
                            guildId: guild.id,
                            userId: member.id
                        });
                    }

                    data.xp += 5;

                    const need = data.level * 120;

                    if (data.xp >= need) {
                        data.xp -= need;
                        data.level++;

                        channel.send(`🎉 ${member} Voice Level Up ${data.level}`);
                    }

                    await data.save();
                }
            }
        }

    }, 60000);
};