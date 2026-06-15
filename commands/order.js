const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('order')
        .setDescription('Gửi Bảng Order Ticket'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🛒 ORDER')
            .setDescription(
                'Nhấn nút bên dưới để tạo ticket đặt hàng.\n\n' +
                `• Đặt Hàng\n` +
                `• Thanh Toán\n` +
                `• Kiểm Tra Đơn Hàng\n` +
                `• Lỗi Giao Dịch\n\n` +
                `⏱ Staff sẽ hỗ trợ sớm nhất.`
            )
            .setColor('Green');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_order')
                    .setLabel('ORDER')
                    .setEmoji('🛒')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
