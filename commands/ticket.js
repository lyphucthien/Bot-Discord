const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');

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
                    description: 'Báo cáo người dùng / lỗi',
                    value: 'report',
                    emoji: '🚨'
                },
                {
                    label: 'Order',
                    description: 'Đặt hàng / mua dịch vụ',
                    value: 'order',
                    emoji: '🛒'
                }
            );

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};