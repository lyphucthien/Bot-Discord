const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readDB } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng Xếp Hạng Level'),

    async execute(interaction) {

        const levels = readDB('Level.js');

        const sorted = Object.entries(levels)
            .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
            .slice(0, 10);

        if (!sorted.length) {
            return interaction.reply({
                content: '❌ Chưa có dữ liệu!',
                flags: 64
            });
        }

        let desc = '';

        for (let i = 0; i < sorted.length; i++) {
            const [userId, data] = sorted[i];

            let name = 'Unknown';

            try {
                const user = await interaction.client.users.fetch(userId);
                name = user.username;
            } catch { }

            desc += `**${i + 1}.** ${name} • Lv ${data.level} • XP ${data.xp}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Level Leaderboard')
            .setDescription(desc)
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};