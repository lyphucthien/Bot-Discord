module.exports = (client) => {

    setInterval(async () => {

        for (const guild of client.guilds.cache.values()) {

            for (const channel of guild.channels.cache.values()) {

                if (!channel.isVoiceBased()) continue;

                const members = channel.members.filter(
                    m => !m.user.bot
                );

                if (members.size === 0) continue;

                let xpAmount = 2;

                if (members.size >= 2) {
                    xpAmount = 5;
                }

                for (const member of members.values()) {

                    await addXP(
                        member.id,
                        guild.id,
                        xpAmount
                    );
                }
            }
        }

    }, 60000);

};