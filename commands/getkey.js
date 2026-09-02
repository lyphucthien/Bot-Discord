const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Lấy Key Xác Thực Server MC'),
    async execute(interaction) {
        const link = 'https://link4sub.com/owycAYxKdu';

        await interaction.reply({
            content: `🔑 Đây là link của bạn:\n**GetKey >** [Get Key](${link})`,
            ephemeral: true
        });
    },
};
