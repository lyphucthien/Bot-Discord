const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../utils/levelDB');

function xpFor(level) {
    return level * level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Xem Level Của Bạn'),

    async execute(interaction) {

        let userData =
            Level.get(interaction.user.id);

        if (!userData) {

            Level.create(interaction.user.id);

            userData =
                Level.get(interaction.user.id);
        }

        const currentLevel =
            userData.level;

        const nextXP =
            xpFor(currentLevel + 1);

        const currentXP =
            userData.xp;

        const percentage =
            Math.floor(
                (currentXP / nextXP) * 100
            );

        const filled =
            Math.round(
                (currentXP / nextXP) * 10
            );

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
                    value: `${currentLevel}`,
                    inline: true
                },
                {
                    name: '✨ XP',
                    value: `${currentXP}/${nextXP}`,
                    inline: true
                },
                {
                    name: '📈 Tiến Trình',
                    value:
                        `${bar} ${percentage}%`,
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