module.exports = (client) => {

    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} Đã Online`);

        const commands = await client.application.commands.fetch();

        console.log(
            "📌 Slash Commands:",
            commands.map(cmd => cmd.name).join(', ')
        );

        const statuses = [
            { name: "💡 Gõ /help Để Xem Lệnh", type: 0 },
            { name: "⚡ Discord Bot Pro", type: 3 },
            { name: "🌱 Server Đang Phát Triển", type: 3 },
            { name: `👥Đang Phục Vụ Cho ${client.guilds.cache.size} Servers`, type: 3 },
            { name: "🚀 Online 24/7", type: 3 },
            { name: "😎 Sẵn Sàng Hỗ Trợ Mọi Lúc", type: 2 }
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
