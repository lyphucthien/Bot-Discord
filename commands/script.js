const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('script')
        .setDescription('Gửi Nội Dung Script (Chỉ Bạn Thấy)')
        .addStringOption(option =>
            option.setName('noi-dung')
                .setDescription('Nội dung script cần gửi')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('tieu-de')
                .setDescription('Tiêu đề hiển thị (không bắt buộc)')
                .setRequired(false)
        ),

    async execute(interaction) {

        const content = interaction.options.getString('noi-dung');
        const title = interaction.options.getString('tieu-de') || '📜 Script';

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(title)
            .setDescription(`\`\`\`lua\n${content}\n\`\`\``)
            .setFooter({
                text: `Chỉ ${interaction.user.username} có thể thấy tin nhắn này`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: 64 // ephemeral - chỉ người dùng lệnh thấy
        });
    }
};
