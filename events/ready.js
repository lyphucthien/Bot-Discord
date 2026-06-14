module.exports = (client) => {

    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} Đã Online`);

        const commands = await client.application.commands.fetch();

        console.log(
            "📌 Slash Commands:",
            commands.map(cmd => cmd.name).join(', ')
        );

        // 🔧 BẬT / TẮT BẢO TRÌ Ở ĐÂY
        const MAINTENANCE = true;

        function getRandomType() {
            const rand = Math.random() * 100;

            if (rand < 25) return 0;      // Playing
            if (rand < 40) return 2;      // Listening
            return 3;                     // Watching
        }

        if (MAINTENANCE) {
            return client.user.setPresence({
                status: "dnd", // 🔴 đỏ
                activities: [
                    {
                        name: "🔧 Đang Bảo Trì Hệ Thống",
                        type: 0
                    }
                ],
            });
        }

        let i = 0;

        setInterval(() => {

            const statuses = [
                "🟢 Bot Online",
                `👥 Đang Phục Vụ Cho ${client.guilds.cache.size} Servers`,
                "💡 /help Để Xem Danh Sách Lệnh",
                "😎 Sẵn Sàng Hỗ Trợ Mọi Lúc",
                "🚀 Online 24/7",
                "🌱 Server Đang Phát Triển",
                "⚡ Discord Bot Pro (Version 1.0)",
            ];

            client.user.setPresence({
                status: "online",
                activities: [
                    {
                        name: statuses[i],
                        type: getRandomType()
                    }
                ],
            });

            i = (i + 1) % statuses.length;

        }, 8000);

    });

};
