module.exports = (client) => {

    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} Đã Online`);

        const commands = await client.application.commands.fetch();

        console.log(
            "📌 Slash Commands:",
            commands.map(cmd => cmd.name).join(', ')
        );

        const statuses = [
            "🟢 Bot Online",
            `👥 Đang Phục Vụ Cho ${client.guilds.cache.size} Servers`,
            "💡 /help Để Xem Danh Sách Lệnh",
            "😎 Sẵn Sàng Hỗ Trợ Mọi Lúc",
            "🚀 Online 24/7",
            "🌱 Server Đang Phát Triển",
            "⚡ Discord Bot Pro (Version 1.0)",
        ];

        let i = 0;

        function getRandomType() {
            const rand = Math.random() * 100;

            if (rand < 25) return 0;      // Playing 25%
            if (rand < 40) return 2;      // Listening 15% (25-40)
            return 3;                     // Watching 60%
        }

        client.user.setPresence({
            status: "online", // 👈 luôn hiển thị xanh
            activities: [
                {
                    name: statuses[0],
                    type: getRandomType()
                }
            ],
        });

        setInterval(() => {
            const status = statuses[i];

            client.user.setPresence({
                status: "online", // luôn online
                activities: [
                    {
                        name: status,
                        type: getRandomType()
                    }
                ],
            });

            i++;
            if (i >= statuses.length) i = 0;

        }, 8000);

    });

};
