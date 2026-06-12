const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gửi Bảng Ticket'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket System')
            .setDescription(
                `📌 Chọn loại ticket bạn muốn tạo:\n\n` +
                `🛠️ Support → Hỗ Trợ\n` +
                `🚨 Report → Báo Cáo Người Dùng / Lỗi\n` +
                `🛒 Order → Đặt Hàng / Mua Dịch Vụ\n\n` +
                `⏱ Thời Gian Staff Phản Hồi: 1–30 Phút\n` +
                `📦 Version: v1.0 (Test)`,
            )
            .setColor('Blue');

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_menu')
            .setPlaceholder('📌 Chọn loại ticket...')
            .addOptions(
                {
                    label: 'Support',
                    description: 'Hỗ Trợ',
                    value: 'support',
                    emoji: '🛠️'
                },
                {
                    label: 'Report',
                    description: 'Báo Cáo Người Dùng / Lỗi',
                    value: 'report',
                    emoji: '🚨'
                },
                {
                    label: 'Order',
                    description: 'Đặt Hàng / Mua Dịch Vụ',
                    value: 'order',
                    emoji: '🛒'
                }
            );

        const menuRow = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            embeds: [embed],
            components: [menuRow]
        });
    }
};
