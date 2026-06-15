const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Tạo Ticket Hỗ Trợ'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🛠️ Support Ticket')
            .setDescription(
                `📌 Vui Lòng Mô Tả Chi Tiết Vấn Đề Của Bạn.\n\n` +
                `• Hỗ Trợ Kỹ Thuật\n` +
                `• Lỗi Bot / Hệ Thống\n` +
                `• Các Vấn Đề Khác\n\n` +
                `⏱ Staff sẽ phản hồi sớm nhất có thể.`
            )
            .setColor('Blue');

        await interaction.reply({
            embeds: [embed]
        });
    }
};