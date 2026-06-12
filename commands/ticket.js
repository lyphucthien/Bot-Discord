const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gửi Bảng Ticket'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket System')
            .setDescription('Chọn loại ticket bạn muốn tạo:')
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

        const row = new ActionRowBuilder().addComponents(
            menu,
            new ButtonBuilder()
                .setCustomId('ticket_info')
                .setLabel('ℹ️ Info')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
