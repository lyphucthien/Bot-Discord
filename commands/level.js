const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const Level = require(path.join(__dirname, '../models/Level'));

function xpFor(level) {
    return level * level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Xem Level Của Bạn'),

    async execute(interaction) {

        const userId = interaction.user.id;

        // ======================
        // FIND OR CREATE USER
        // ======================
        let userData = await Level.findOne({ userId });

        if (!userData) {
            userData = await Level.create({
                userId,
                xp: 0,
                level: 1
            });
        }

        const currentLevel = Math.max(1, userData.level);

        const currentXP = xpFor(currentLevel);
        const nextXP = xpFor(currentLevel + 1);

        const progressXP = Math.max(0, userData.xp - currentXP);
        const neededXP = nextXP - currentXP || 1;

        const progress = Math.min(1, progressXP / neededXP);
        const percentage = Math.floor(progress * 100);

        const filled = Math.round(progress * 10);
        const bar = '🟩'.repeat(filled) + '⬜'.repeat(10 - filled);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setThumbnail(interaction.user.displayAvatarURL({ size: 512 }))
            .setTitle('📊 Thông Tin Level')
            .addFields(
                {
                    name: '⭐ Level',
                    value: `${currentLevel}`,
                    inline: true
                },
                {
                    name: '✨ XP',
                    value: `${userData.xp}`,
                    inline: true
                },
                {
                    name: '📈 Tiến Trình',
                    value:
                        `${bar} ${percentage}%\n${progressXP}/${neededXP} XP`,
                    inline: false
                }
            )
            .setFooter({
                text: interaction.guild.name
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
