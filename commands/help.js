const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem Danh Sách Lệnh'),

    async execute(interaction) {

        const pages = [

            // ===== TRANG 1 =====
            new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📖 Help Menu (1/2)')
                .setDescription(`

\`/help\`
➜ Hiển Thị Danh Sách Lệnh

\`/ban <user>\`
➜ Cấm Thành Viên Khỏi Server

\`/kick <user>\`
➜ Đuổi Thành Viên Khỏi Server

\`/clear <amount>\`
➜ Xóa Nhiều Tin Nhắn

\`/mute <user>\`
➜ Hạn Chế (Timeout) Thành Viên

\`/unmute <user>\`
➜ Gỡ timeout thành viên

\`/warn <user>\`
➜ Cảnh Cáo Thành Viên

\`/setrole add/remove/toggle\`
➜ Quản Lý Role Thành Viên
    `),

            // ===== TRANG 2 =====
            new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📖 Help Menu (2/2)')
                .setDescription(`

\`/ticket\`
➜ Tạo Hệ Thống Ticket

\`/verify\`
➜ Tạo Hệ Thống Xác Minh

\`/giveaway\`
➜ Tạo Giveaway

\`/reroll\`
➜ Quay Lại Giveaway

\`/level\`
➜ Xem Level Của Bạn

\`/leaderboard\`
➜ Bảng Xếp Hạng Level

\`/stats\`
➜ Thống Kê Server
    `)
        ];

        let page = 0;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setEmoji('⬅️')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('next')
                    .setEmoji('➡️')
                    .setStyle(ButtonStyle.Secondary)
            );

        const msg = await interaction.reply({
            embeds: [pages[page]],
            components: [row],
            withResponse: true
        });

        const collector = msg.createMessageComponentCollector({
            time: 300000
        });

        collector.on('collect', async i => {

            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: '❌ Chỉ người dùng lệnh mới có thể sử dụng menu này.',
                    flags: 64
                });
            }

            if (i.customId === 'next') {
                page = (page + 1) % pages.length;
            }

            if (i.customId === 'prev') {
                page = (page - 1 + pages.length) % pages.length;
            }

            await i.update({
                embeds: [pages[page]],
                components: [row]
            });
        });

        collector.on('end', async () => {

            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),

                    new ButtonBuilder()
                        .setCustomId('next')
                        .setEmoji('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            await msg.edit({
                components: [disabledRow]
            }).catch(() => { });
        });

    }
};