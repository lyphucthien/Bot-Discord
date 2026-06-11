const { ChannelType } = require('discord.js');

module.exports = (client) => {

    async function updateStats(guild) {
        try {

            const totalMembers = guild.memberCount;

            const bots = guild.members.cache.filter(m => m.user.bot).size;

            const boosts = guild.premiumSubscriptionCount || 0;

            const online = guild.members.cache.filter(
                m => m.presence?.status !== 'offline'
            ).size;

            // ID các kênh stats
            const statsChannels = {
                members: '1514454436905353326',
                bots: '1514454572729372803',
                boosts: '1514454605998592110',
                online: '1514454494119858206'
            };

            const updates = [
                [statsChannels.members, `👥 Members: ${totalMembers}`],
                [statsChannels.bots, `🤖 Bots: ${bots}`],
                [statsChannels.boosts, `🚀 Boosts: ${boosts}`],
                [statsChannels.online, `🟢 Online: ${online}`]
            ];

            for (const [id, name] of updates) {
                const channel = guild.channels.cache.get(id);
                if (channel && channel.name !== name) {
                    await channel.setName(name);
                }
            }

        } catch (err) {
            console.error(err);
        }
    }

    client.on('ready', () => {
        const guild = client.guilds.cache.first();

        updateStats(guild);

        setInterval(() => {
            updateStats(guild);
        }, 4 * 60 * 1000);
    });

    client.on('guildMemberAdd', member => updateStats(member.guild));
    client.on('guildMemberRemove', member => updateStats(member.guild));
};