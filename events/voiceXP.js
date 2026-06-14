const levelDB = require('../utils/levelDB');

function xpFor(level) {
    return level * level * 100;
}

module.exports = (client) => {

    setInterval(() => {

        for (const guild of client.guilds.cache.values()) {

            for (const channel of guild.channels.cache.values()) {

                if (!channel.isVoiceBased()) continue;

                const members =
                    channel.members.filter(
                        m => !m.user.bot
                    );

                if (members.size === 0) continue;

                const xpAmount =
                    members.size >= 2 ? 5 : 2;

                for (const member of members.values()) {

                    const user =
                        levelDB.get(member.id);

                    let currentXP =
                        user.xp + xpAmount;

                    let currentLevel =
                        user.level;

                    while (
                        currentXP >=
                        xpFor(currentLevel + 1)
                    ) {

                        currentXP -=
                            xpFor(currentLevel + 1);

                        currentLevel++;
                    }

                    levelDB.update(
                        member.id,
                        currentXP,
                        currentLevel
                    );
                }
            }
        }

    }, 60000);

};