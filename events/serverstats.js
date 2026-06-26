module.exports = (client) => {

    const GUILD_ID = "1496474678515073046";
    const OWNER_ID = "1330395226933559297";

    const CHANNELS = {
        owner: "1514454494119858206",

        boosts: "1514454605998592110",
        members: "1514454436905353326",

        onlineIdle: "1515573448192167948",
        dndOffline: "1515581678897070115"
    };

    let updateTimeout = null;

    async function setChannelName(channel, name) {
        if (!channel) return;

        if (channel.name !== name) {
            try {
                await channel.setName(name);
            } catch (err) {
                console.error(`Không Thể Đổi Tên Kênh ${channel.id}:`, err);
            }
        }
    }

    async function updateStats() {

        try {

            const guild = client.guilds.cache.get(GUILD_ID);
            if (!guild) return;

            const members = guild.memberCount;

            const online = guild.members.cache.filter(
                m => !m.user.bot && m.presence?.status === "online"
            ).size;

            const idle = guild.members.cache.filter(
                m => !m.user.bot && m.presence?.status === "idle"
            ).size;

            const dnd = guild.members.cache.filter(
                m => !m.user.bot && m.presence?.status === "dnd"
            ).size;

            const offline = guild.members.cache.filter(
                m =>
                    !m.user.bot &&
                    (!m.presence || m.presence.status === "offline")
            ).size;

            const boosts = guild.premiumSubscriptionCount ?? 0;

            const owner = guild.members.cache.get(OWNER_ID);

            let ownerStatus = "⚫ 𝗢W𝗡𝗘𝗥 • Offline";

            if (owner?.presence) {
                switch (owner.presence.status) {
                    case "online":
                        ownerStatus = "🟢 𝗢W𝗡𝗘𝗥 • Online";
                        break;

                    case "idle":
                        ownerStatus = "🌙 𝗢W𝗡𝗘𝗥 • Idle";
                        break;

                    case "dnd":
                        ownerStatus = "⛔ 𝗢W𝗡𝗘𝗥 • DND";
                        break;
                }
            }

            const ownerChannel = guild.channels.cache.get(CHANNELS.owner);
            const boostsChannel = guild.channels.cache.get(CHANNELS.boosts);
            const membersChannel = guild.channels.cache.get(CHANNELS.members);
            const onlineIdleChannel = guild.channels.cache.get(CHANNELS.onlineIdle);
            const dndOfflineChannel = guild.channels.cache.get(CHANNELS.dndOffline);

            await Promise.all([
                setChannelName(ownerChannel, ownerStatus),

                setChannelName(
                    boostsChannel,
                    `🚀 𝗕𝗢𝗢𝗦𝗧𝗘𝗥𝗦: ${boosts}`
                ),

                setChannelName(
                    membersChannel,
                    `👥 𝗠𝗘𝗠𝗕𝗘𝗥𝗦: ${members}`
                ),

                setChannelName(
                    onlineIdleChannel,
                    `🟢 𝗢𝗡𝗟𝗜𝗡𝗘: ${online}  | 🌙 𝗜𝗗𝗟𝗘: ${idle}`
                ),

                setChannelName(
                    dndOfflineChannel,
                    `⛔ 𝗗𝗡𝗗: ${dnd}  | ⚫ 𝗢𝗙𝗙𝗟𝗜𝗡𝗘: ${offline}`
                )
            ]);

        } catch (err) {
            console.error("Lỗi Update Stats:", err);
        }
    }

    function scheduleUpdate() {

        clearTimeout(updateTimeout);

        updateTimeout = setTimeout(updateStats, 3000);

    }

    client.once("clientReady", async () => {

        await updateStats();

        setInterval(updateStats, 30000);

    });

    client.on("presenceUpdate", (_, newPresence) => {
        if (newPresence.userId === OWNER_ID) {
            scheduleUpdate();
        }
    });

    client.on("guildMemberAdd", scheduleUpdate);

    client.on("guildMemberRemove", scheduleUpdate);

    client.on("guildMemberUpdate", scheduleUpdate);

};
