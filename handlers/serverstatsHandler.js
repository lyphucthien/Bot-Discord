const { ChannelType } = require('discord.js');

module.exports = (client) => {

    async function updateStats(guild) {
        try {

            const totalMembers = guild.memberCount;
            const boosts = guild.premiumSubscriptionCount || 0;

            // lấy owner
            let owner = guild.members.cache.get(guild.ownerId);
            if (!owner) owner = await guild.members.fetch(guild.ownerId);

            const status = owner?.presence?.status;

            const ownerStatusMap = {
                online: '🟢 OWNER • Online',
                idle: '🌙 OWNER • Idle',
                dnd: '⛔ OWNER • DND'
            };

            const ownerStatus = ownerStatusMap[status] || '🔴 OWNER • Offline';

            const statsChannels = {
                owner: '1514454494119858206',
                members: '1514454436905353326',
                boosters: '1514454605998592110'
            };

            const updates = [
                [statsChannels.owner, ownerStatus],
                [statsChannels.members, `👥 𝗠𝗘𝗠𝗕𝗘𝗥𝗦: ${totalMembers}`],
                [statsChannels.boosters, `🚀 𝗕𝗢𝗢𝗦𝗧𝗘𝗥𝗦: ${boosts}`]
            ];

            for (const [id, name] of updates) {
                const channel = guild.channels.cache.get(id);

                if (!channel) continue;
                if (channel.type !== ChannelType.GuildVoice) continue;

                if (channel.name !== name) {
                    await channel.setName(name);
                }
            }

        } catch (err) {
            console.error('❌ ServerStats error:', err);
        }
    }

    // IMPORTANT: chỉ return function, KHÔNG tự chạy event ở đây
    return updateStats;
};