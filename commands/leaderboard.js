const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, '../data/levels.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng Xếp Hạng Lever'),

    async execute(interaction) {

        const levels = JSON.parse(
            fs.readFileSync(levelFile, 'utf8')
        );

        const sorted = Object.entries(levels)
            .sort((a, b) => b[1].level - a[1].level)
            .slice(0, 10);

        let desc = '';

        for (let i = 0; i < sorted.length; i++) {
            const user = await interaction.client.users.fetch(sorted[i][0]);

            desc += `**${i + 1}.** ${user.username} • Lv ${sorted[i][1].level}\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Level Leaderboard')
            .setDescription(desc);

        await interaction.reply({
            embeds: [embed]
        });
    }
};