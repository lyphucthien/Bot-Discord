const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Lấy key/link truy cập'),
    async execute(interaction) {
        const link = 'https://link4sub.com/owycAYxKdu'; // đổi thành link thật

        await interaction.reply({
            content: `🔑 Đây là link của bạn:\n${link}`,
            ephemeral: true
        });
    },
};