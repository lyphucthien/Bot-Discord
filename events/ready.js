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
            "⚡ Discord Bot Pro",
        ];

        const types = [0, 2, 3];

        let i = 0;

        setInterval(() => {
            const status = statuses[i];

            const type = types[Math.floor(Math.random() * types.length)];

            client.user.setActivity(status, {
                type: type
            });

            i++;

            if (i >= statuses.length) i = 0;

        }, 8000);

    });

};
