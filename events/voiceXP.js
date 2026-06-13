const Level = require('../database/models/Level');

function xpFor(level) {
    return level * level * 100;
}

module.exports = (client) => {

    setInterval(async () => {

        for (const guild of client.guilds.cache.values()) {

            for (const channel of guild.channels.cache.values()) {

                if (!channel.isVoiceBased()) continue;

                const members = channel.members.filter(m => !m.user.bot);
                if (members.size === 0) continue;

                const xpAmount = members.size >= 2 ? 5 : 2;

                for (const member of members.values()) {

                    let user = await Level.findOne({ userId: member.id });

                    if (!user) {
                        user = await Level.create({
                            userId: member.id,
                            xp: 0,
                            level: 1
                        });
                    }

                    user.xp += xpAmount;

                    while (user.xp >= xpFor(user.level + 1)) {
                        user.xp -= xpFor(user.level + 1);
                        user.level++;
                    }

                    await user.save();
                }
            }
        }

    }, 60000);
};
