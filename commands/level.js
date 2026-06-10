const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, '../data/levels.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Xem Level Của Bạn'),

    async execute(interaction) {

        let levels = {};

        if (fs.existsSync(levelFile)) {
            levels = JSON.parse(fs.readFileSync(levelFile, 'utf8'));
        }

        const userId = interaction.user.id;

        if (!levels[userId]) {
            levels[userId] = {
                xp: 0,
                level: 1
            };
        }

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`📊 Level của ${interaction.user.username}`)
            .addFields(
                {
                    name: '⭐ Level',
                    value: `${levels[userId].level}`,
                    inline: true
                },
                {
                    name: '✨ XP',
                    value: `${levels[userId].xp}`,
                    inline: true
                }
            );

        await interaction.reply({
            embeds: [embed]
        });
    }
};