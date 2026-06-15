const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Tạo Ticket Báo Cáo'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🚨 Report Ticket')
            .setDescription(
                `📌 Vui Lòng Cung Cấp Bằng Chứng Khi Báo Cáo.\n\n` +
                `• Báo Cáo Người Chơi\n` +
                `• Spam / Scam\n` +
                `• Link Độc Hại\n` +
                `• Vi Phạm Quy Định\n\n` +
                `⏱ Staff sẽ kiểm tra và xử lý.`
            )
            .setColor('Red');

        await interaction.reply({
            embeds: [embed]
        });
    }
};