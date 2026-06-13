const fs = require('fs');
const levelFile = require('../utils/levelFile');

function xpFor(level) {
    return level * level * 100;
}

module.exports = (client) => {

    setInterval(() => {

        let levels = {};

        if (fs.existsSync(levelFile)) {
            try {
                levels = JSON.parse(fs.readFileSync(levelFile, 'utf8'));
            } catch {
                levels = {};
            }
        }

        for (const guild of client.guilds.cache.values()) {

            for (const channel of guild.channels.cache.values()) {

                if (!channel.isVoiceBased()) continue;

                const members = channel.members.filter(m => !m.user.bot);
                if (members.size === 0) continue;

                const xpAmount = members.size >= 2 ? 5 : 2;

                for (const member of members.values()) {

                    const userId = member.id;

                    if (!levels[userId]) {
                        levels[userId] = { xp: 0, level: 1 };
                    }

                    levels[userId].xp += xpAmount;

                    while (levels[userId].xp >= xpFor(levels[userId].level + 1)) {
                        levels[userId].xp -= xpFor(levels[userId].level + 1);
                        levels[userId].level++;
                    }
                }
            }
        }

        fs.writeFileSync(levelFile, JSON.stringify(levels, null, 2));

    }, 60000);
};