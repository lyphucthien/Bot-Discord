const fs = require('fs');
const path = require('path');
const cooldowns = new Map();
const levelFile = path.join(
    __dirname,
    '../data/levels.json'
);

function xpFor(level) {
    if (level <= 0) return 0;
    return level * level * 100;
}

module.exports = (client) => {

    setInterval(() => {

        let levels = {};

        if (fs.existsSync(levelFile)) {
            levels = JSON.parse(
                fs.readFileSync(levelFile, 'utf8')
            );
        }

        for (const guild of client.guilds.cache.values()) {

            for (const channel of guild.channels.cache.values()) {

                if (!channel.isVoiceBased()) continue;

                const members = channel.members.filter(
                    m => !m.user.bot
                );

                if (members.size === 0) continue;

                let xpAmount = members.size >= 2
                    ? 5
                    : 2;

                for (const member of members.values()) {

                    if (!levels[member.id]) {
                        levels[member.id] = {
                            xp: 0,
                            level: 1
                        };
                    }

                    levels[member.id].xp += xpAmount;

                    while (
                        levels[member.id].xp >=
                        xpFor(levels[member.id].level + 1)
                    ) {
                        levels[member.id].level++;
                    }
                }
            }
        }

        fs.writeFileSync(
            levelFile,
            JSON.stringify(levels, null, 4)
        );

    }, 60000);

};
