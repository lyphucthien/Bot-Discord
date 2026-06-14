module.exports = (client) => {

    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} Đã Online`);

        const commands = await client.application.commands.fetch();
        console.log(
            "📌 Slash Commands:",
            commands.map(cmd => cmd.name).join(', ')
        );

        const statuses = [
            { name: "Discord Bot Pro", type: 3 }, // Watching
            { name: "/help để xem lệnh", type: 0 }, // Playing
            { name: `${client.guilds.cache.size} servers`, type: 3 },
            { name: "users đang online", type: 2 } // Listening
        ];
        let i = 0;
        setInterval(() => {
            const status = statuses[i];

            client.user.setActivity(status.name, {
                type: status.type
            });

            i++;

            if (i >= statuses.length) i = 0;

        }, 5000);

    });

};
