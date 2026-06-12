const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, '../data/levels.json');

function xpFor(level) {
    return level * level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Xem Level Của Bạn'),

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
            return interaction.reply({
                content: '❌ Không thể đọc dữ liệu level!',
                flags: 64
            });
        }

        const userId = interaction.user.id;

        const userData = levels[userId] || {
            xp: 0,
            level: 1
        };

        // ======================
        // SAFE LEVEL CALC
        // ======================
        const currentLevel = Math.max(1, userData.level);

        const currentXP = xpFor(currentLevel);
        const nextXP = xpFor(currentLevel + 1);

        const progressXP = Math.max(0, userData.xp - currentXP);
        const neededXP = nextXP - currentXP || 1;

        const progress = Math.min(1, progressXP / neededXP);
        const percentage = Math.floor(progress * 100);

        const filled = Math.round(progress * 10);
        const bar = '🟩'.repeat(filled) + '⬜'.repeat(10 - filled);

        // ======================
        // EMBED
        // ======================
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setThumbnail(
                interaction.user.displayAvatarURL({ size: 512 })
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
                    value: `${userData.xp}`,
                    inline: true
                },
                {
                    name: '📈 Tiến Trình',
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

        return interaction.reply({
            embeds: [embed]
        });
    }
};