const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Gửi Bảng Report Ticket'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🚨 Tạo Phiếu Tố Cáo')
            .setDescription(
                'Nhấn nút bên dưới để tạo ticket báo cáo.\n\n' +
                `• Báo Cáo Người Chơi\n` +
                `• Spam / Scam\n` +
                `• Link Độc Hại\n` +
                `• Vi Phạm Quy Định\n\n` +
                `⏱ Staff sẽ kiểm tra và xử lý.`
            )
            .setColor('Red');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_report')
                    .setLabel('Báo Cáo')
                    .setEmoji('🚨')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
