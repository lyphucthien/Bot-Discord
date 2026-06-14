const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../utils/levelDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng Xếp Hạng Level'),

    async execute(interaction) {

        const top = Level
            .getLeaderboard()
            .slice(0, 10);

        if (!top.length) {
            return interaction.reply({
                content: '❌ Chưa có dữ liệu level',
                flags: 64
            });
        }

        let desc = '';

        for (let i = 0; i < top.length; i++) {

            const data = top[i];

            let username = 'Unknown User';

            try {
                const user = await interaction.client.users.fetch(data.userId);
                username = user.username;
            } catch { }

            desc +=
                `🏅 **#${i + 1}** ${username}\n` +
                `┗ Level: **${data.level}** | XP: **${data.xp}**\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Bảng Xếp Hạng Level')
            .setDescription(desc)
            .setFooter({
                text: interaction.guild.name
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
