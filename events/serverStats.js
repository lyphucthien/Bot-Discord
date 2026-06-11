const { ChannelType } = require('discord.js');

module.exports = (client) => {

    async function updateStats(guild) {
        try {

            await guild.members.fetch();

            const totalMembers = guild.memberCount;
            const boosts = guild.premiumSubscriptionCount || 0;

            // Owner server
            const owner = await guild.fetchOwner();

            const ownerStatus =
                owner.presence?.status &&
                    owner.presence.status !== 'offline'
                    ? '🟢 Owner: Online'
                    : '🔴 Owner: Offline';

            const statsChannels = {
                owner: '1514454494119858206',
                members: '1514454436905353326',
                boosters: '1514454605998592110'
            };

            const updates = [
                [statsChannels.owner, ownerStatus],
                [statsChannels.members, `👥 Members: ${totalMembers}`],
                [statsChannels.boosters, `🚀 Boosters: ${boosts}`]
            ];

            for (const [id, name] of updates) {
                const channel = guild.channels.cache.get(id);

                if (
                    channel &&
                    channel.type === ChannelType.GuildVoice &&
                    channel.name !== name
                ) {
                    await channel.setName(name);
                }
            }

        } catch (err) {
            console.error(err);
        }
    }

    client.on('clientReady', () => {
        const guild = client.guilds.cache.first();

        updateStats(guild);

        setInterval(() => {
            updateStats(guild);
        }, 3 * 60 * 1000);
    });

    client.on('guildMemberAdd', member => updateStats(member.guild));
    client.on('guildMemberRemove', member => updateStats(member.guild));

    // Cập nhật khi owner đổi trạng thái
    client.on('presenceUpdate', (_, newPresence) => {
        if (newPresence?.guild) {
            updateStats(newPresence.guild);
        }
    });

};
