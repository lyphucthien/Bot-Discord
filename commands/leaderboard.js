const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, '../data/levels.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng Xếp Hạng Level'),

    async execute(interaction) {

        let levels = {};

        // ======================
        // SAFE READ FILE
        // ======================
        try {
            if (fs.existsSync(levelFile)) {
                const data = fs.readFileSync(levelFile, 'utf8');
                levels = data ? JSON.parse(data) : {};
            }
        } catch (err) {
            console.error('Lỗi đọc levels.json:', err);
            return interaction.reply({
                content: '❌ Không thể đọc dữ liệu level!',
                flags: 64
            });
        }

        // ======================
        // SORT BY XP (CHUẨN HƠN LEVEL)
        // ======================
        const sorted = Object.entries(levels)
            .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
            .slice(0, 10);

        if (sorted.length === 0) {
            return interaction.reply({
                content: '❌ Chưa có dữ liệu leaderboard!',
                flags: 64
            });
        }

        let desc = '';

        // ======================
        // BUILD LEADERBOARD
        // ======================
        for (let i = 0; i < sorted.length; i++) {

            const userId = sorted[i][0];
            const data = sorted[i][1];

            let userTag = 'Unknown User';

            try {
                const user = await interaction.client.users.fetch(userId);
                userTag = user.username;
            } catch {
                userTag = `User ${userId}`;
            }

            desc += `**${i + 1}.** ${userTag} • Lv ${data.level} • XP ${data.xp}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Level Leaderboard')
            .setDescription(desc)
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};