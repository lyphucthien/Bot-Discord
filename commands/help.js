const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem Danh Sách Lệnh'),

    async execute(interaction) {

        const pages = [

            new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("📖 Help Menu (1/4)")
                .setDescription(`
            ━━━━━━━━━━━━━━━━━━
            🛠️ **Quản lý Server**
            ━━━━━━━━━━━━━━━━━━ 

            \`/ban <user>\`
            ➜ Cấm thành viên

            \`/kick <user>\`
            ➜ Đuổi thành viên

            \`/mute <user>\`
            ➜ Timeout thành viên

            \`/unmute <user>\`
            ➜ Gỡ timeout

            \`/warn <user>\`
            ➜ Cảnh cáo thành viên

            \`/clear <amount>\`
            ➜ Xóa nhiều tin nhắn

            \`/setrole\`
            ➜ Thêm / Xóa / Toggle Role
            `),

            new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("📖 Help Menu (2/4)")
                .setDescription(`
            ━━━━━━━━━━━━━━━━━━
            🎉 **Tiện ích Server**
            ━━━━━━━━━━━━━━━━━━

            \`/verify\`
            ➜ Tạo bảng hệ thống Verify

            \`/giveaway create\`
            ➜ Tạo Giveaway

            \`/giveaway reroll\`
            ➜ Quay lại Giveaway

            \`/giveaway end\`
            ➜ Kết thúc Giveaway sớm

            \`/report\`
            ➜ Báo cáo thành viên

            \`/support\`
            ➜ Hiển thị thông tin hỗ trợ

            \`/script\`
            ➜ Mở giao diện gửi Script

            \`/ping\`
            ➜ Xem độ trễ của Bot
            `),

            new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("📖 Help Menu (3/3)")
                .setDescription(`
            ━━━━━━━━━━━━━━━━━━
            👑 **Owner**
            ━━━━━━━━━━━━━━━━━━

            \`/reload\`
            ➜ Reload Command

            \`/restart\`
            ➜ Khởi động lại Bot

            \`/maint <on|off>\`
            ➜ Bật/Tắt chế độ bảo trì


            📚 **Khác**

            \`/help\`
            ➜ Hiển thị danh sách lệnh

            \`/stats\`
            ➜ Thống tin Server
            `)
        ];

        let page = 0;

        const row = () =>
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("first")
                    .setEmoji("⏪")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId("prev")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === pages.length - 1),

                new ButtonBuilder()
                    .setCustomId("last")
                    .setEmoji("⏩")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === pages.length - 1)
            );

        await interaction.reply({
            embeds: [pages[page]],
            components: [row()]
        });

        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            time: 300000
        });

        collector.on("collect", async i => {

            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: "❌ Chỉ người dùng lệnh mới có thể sử dụng menu này.",
                    flags: 64
                });
            }

            switch (i.customId) {

                case "first":
                    page = 0;
                    break;

                case "prev":
                    if (page > 0) page--;
                    break;

                case "next":
                    if (page < pages.length - 1) page++;
                    break;

                case "last":
                    page = pages.length - 1;
                    break;
            }

            await i.update({
                embeds: [pages[page]],
                components: [row()]
            });

        });

        collector.on("end", async () => {

            const disabledRow = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId("first")
                    .setEmoji("⏪")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId("prev")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId("last")
                    .setEmoji("⏩")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)

            );

            await msg.edit({
                components: [disabledRow]
            }).catch(() => { });

        });

    }
};
