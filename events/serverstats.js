module.exports = (client) => {

    const OWNER_ID = '1330395226933559297';

    async function updateStats() {

        const guild = client.guilds.cache.get('1496474678515073046');
        if (!guild) return;

        const members = guild.memberCount;

        const bots = guild.members.cache.filter(
            m => m.user.bot
        ).size;

        const onlineCount = guild.members.cache.filter(
            m => !m.user.bot && m.presence?.status === 'online'
        ).size;

        const idleCount = guild.members.cache.filter(
            m => !m.user.bot && m.presence?.status === 'idle'
        ).size;

        const dndCount = guild.members.cache.filter(
            m => !m.user.bot && m.presence?.status === 'dnd'
        ).size;

        const offlineCount = guild.members.cache.filter(
            m => !m.user.bot &&
                (!m.presence || m.presence.status === 'offline')
        ).size;

        const boosts = guild.premiumSubscriptionCount || 0;

        const owner = guild.members.cache.get(OWNER_ID);

        let ownerStatus = '⚫ OWNER • Offline';

        if (owner?.presence) {

            switch (owner.presence.status) {

                case 'online':
                    ownerStatus = '🟢 OWNER • Online';
                    break;

                case 'idle':
                    ownerStatus = '🌙 OWNER • IDLE';
                    break;

                case 'dnd':
                    ownerStatus = '⛔ OWNER • DND';
                    break;

                default:
                    ownerStatus = '⚫ OWNER • Offline';
                    break;
            }
        }

        const channels = {
            owner: guild.channels.cache.get('1514454494119858206'),

            boosts: guild.channels.cache.get('1514454605998592110'),
            members: guild.channels.cache.get('1514454436905353326'),

            onlineIdle: guild.channels.cache.get('1515573448192167948'),
            dndOffline: guild.channels.cache.get('1515581678897070115')

        };
        if (channels.owner)
            channels.owner.setName(ownerStatus);

        if (channels.boosts)
            channels.boosts.setName(`🚀 𝗕𝗢𝗢𝗦𝗧𝗘𝗥𝗦: ${boosts}`);

        if (channels.members)
            channels.members.setName(`👥 𝗠𝗘𝗠𝗕𝗘𝗥𝗦: ${members}`);

        if (channels.onlineIdle)
            channels.onlineIdle.setName(`🟢 𝗢𝗡𝗟𝗜𝗡𝗘: ${onlineCount} | 🌙 𝗜𝗗𝗟𝗘: ${idleCount}`);

        if (channels.dndOffline)
            channels.dndOffline.setName(`⛔ 𝗗𝗡𝗗: ${dndCount} | ⚫ 𝗢𝗙𝗙𝗟𝗜𝗡𝗘: ${offlineCount}`);

    }

    client.once('clientReady', async () => {

        await updateStats();

        setInterval(
            updateStats,
            30000
        );
    });

    client.on('presenceUpdate', (_, newPresence) => {

        if (newPresence.userId !== OWNER_ID) return;

        updateStats();
    });

};
