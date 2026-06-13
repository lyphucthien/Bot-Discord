const serverStats = require('../handlers/serverstatsHandler');

module.exports = (client) => {

    let updateStats;

    client.once('ready', async () => {

        console.log(`✅ ${client.user.tag} đã online`);

        client.user.setActivity('Discord Bot Pro', { type: 3 });

        updateStats = serverStats(client);

        const guild = client.guilds.cache.first();
        if (!guild) return;

        await updateStats(guild);

        setInterval(() => {
            updateStats(guild);
        }, 30000);
    });

    client.on('presenceUpdate', () => {

        if (!updateStats) return;

        const guild = client.guilds.cache.first();
        if (guild) updateStats(guild);
    });

};