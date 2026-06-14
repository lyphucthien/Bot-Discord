const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../utils/levelDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng Xếp Hạng Level'),

    async execute(interaction) {

        // ======================
        // GET DATA
        // ======================
        const top = await Level.find()
            .sort({ xp: -1 })
            .limit(10);

        if (top.length === 0) {
            return interaction.reply({
                content: '❌ Chưa có dữ liệu leaderboard!',
                flags: 64
            });
        }

        let desc = '';

        // ======================
        // BUILD LIST
        // ======================
        for (let i = 0; i < top.length; i++) {

            const data = top[i];

            let userTag = 'Unknown User';

            try {
                const user = await interaction.client.users.fetch(data.userId);
                userTag = user.username;
            } catch {
                userTag = data.userId;
            }

            desc += `**${i + 1}.** ${userTag} • Lv ${data.level} • XP ${data.xp}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 bảng Xếp Hạng Level')
            .setDescription(desc)
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};