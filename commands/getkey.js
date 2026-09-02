const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Lấy Key Xác Thực Server MC'),
    async execute(interaction) {
        const link = 'https://link4sub.com/owycAYxKdu';

        await interaction.reply({
            content: `👉 Nhấn **[Get Key](${link})** để lấy Key.\n⚠️ Mỗi Key có thời hạn sử dụng 3 tiếng.`,
            ephemeral: true
        });
    },
};
