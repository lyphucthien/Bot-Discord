const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('order')
        .setDescription('Tạo Ticket Đặt Hàng'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🛒 Order Ticket')
            .setDescription(
                `📌 Vui lòng ghi rõ nhu cầu của bạn.\n\n` +
                `• Đặt Hàng\n` +
                `• Thanh Toán\n` +
                `• Kiểm Tra Đơn Hàng\n` +
                `• Lỗi Giao Dịch\n\n` +
                `⏱ Staff sẽ hỗ trợ sớm nhất.`
            )
            .setColor('Green');

        await interaction.reply({
            embeds: [embed]
        });
    }
};