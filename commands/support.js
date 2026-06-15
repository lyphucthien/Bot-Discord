const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Gửi Bảng Support Ticket'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🛠️ Tạo Phiếu Hỗ Trợ')
            .setDescription(
                'Nhấn nút bên dưới để tạo ticket hỗ trợ.\n\n' +
                `• Hỗ Trợ Kỹ Thuật\n` +
                `• Lỗi Bot / Hệ Thống\n` +
                `• Các Vấn Đề Khác\n\n` +
                `⏱ Staff sẽ phản hồi sớm nhất có thể.`
            )
            .setColor('Blue');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_support')
                    .setLabel('SUPPORT')
                    .setEmoji('🛠️')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
