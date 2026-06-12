const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelFile = path.join(
    __dirname,
    '../data/levels.json'
);

function xpFor(level) {
    return level * level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Xem Level Của Bạn'),

    async execute(interaction) {

        let levels = {};

        if (fs.existsSync(levelFile)) {
            levels = JSON.parse(
                fs.readFileSync(levelFile, 'utf8')
            );
        }

        const userId = interaction.user.id;

        if (!levels[userId]) {
            levels[userId] = {
                xp: 0,
                level: 1
            };
        }

        const userData = levels[userId];

        const currentLevelXP =
            xpFor(userData.level - 1);

        const nextLevelXP =
            xpFor(userData.level);

        const progressXP =
            userData.xp - currentLevelXP;

        const neededXP =
            nextLevelXP - currentLevelXP;

        const progress =
            Math.max(
                0,
                Math.min(
                    1,
                    progressXP / neededXP
                )
            );

        const percentage =
            Math.floor(progress * 100);

        const filled =
            Math.round(progress * 10);

        const bar =
            '🟩'.repeat(filled) +
            '⬜'.repeat(10 - filled);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: interaction.user.tag,
                iconURL:
                    interaction.user.displayAvatarURL()
            })
            .setThumbnail(
                interaction.user.displayAvatarURL({
                    size: 512
                })
            )
            .setTitle('📊 Thông Tin Level')
            .addFields(
                {
                    name: '⭐ Level',
                    value: `${userData.level}`,
                    inline: true
                },
                {
                    name: '✨ Tổng XP',
                    value: `${userData.xp}`,
                    inline: true
                },
                {
                    name: '📈 Tiến Độ',
                    value:
                        `${bar} ${percentage}%\n` +
                        `${progressXP}/${neededXP} XP`,
                    inline: false
                }
            )
            .setFooter({
                text: interaction.guild.name
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};