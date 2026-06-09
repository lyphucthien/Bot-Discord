const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');

module.exports = {

    name: 'giveaway',

    async execute(message, args) {

        const duration = parseInt(args[0]);
        const prize = args.slice(1).join(' ');

        if (!duration || !prize) {
            return message.reply('Cách Dùng: .giveaway + time + quà');
        }

        // Set lưu người tham gia
        const users = new Set();

        let timeLeft = duration;

        const embed = new EmbedBuilder()
            .setTitle('🎁 GIVEAWAY')
            .setDescription(
                `🏆 Phần thưởng: **${prize}**\n⏳ Còn lại: **${timeLeft}s**`
            )
            .setColor('Gold');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_giveaway')
                    .setLabel('Tham Gia')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Success)
            );

        const msg = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        // ======================
        // BUTTON COLLECTOR
        // ======================
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: duration * 1000
        });

        collector.on('collect', async (interaction) => {

            if (interaction.customId !== 'join_giveaway') return;

            if (users.has(interaction.user.id)) {
                return interaction.reply({
                    content: '⚠️ Bạn đã tham gia rồi!',
                    ephemeral: true
                });
            }

            users.add(interaction.user.id);

            return interaction.reply({
                content: '🎉 Bạn đã tham gia giveaway!',
                ephemeral: true
            });
        });

        // ======================
        // COUNTDOWN UPDATE
        // ======================
        const interval = setInterval(async () => {

            timeLeft--;

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const newEmbed = EmbedBuilder.from(embed)
                .setDescription(
                    `🏆 Phần thưởng: **${prize}**\n⏳ Còn lại: **${timeLeft}s**\n👥 Người tham gia: **${users.size}**`
                );

            await msg.edit({ embeds: [newEmbed] });

        }, 1000);

        // ======================
        // END GIVEAWAY
        // ======================
        setTimeout(async () => {

            collector.stop();

            const participants = [...users];

            let winner;

            if (participants.length === 0) {
                winner = null;
            } else {
                winner = participants[
                    Math.floor(Math.random() * participants.length)
                ];
            }

            const endEmbed = new EmbedBuilder()
                .setTitle('🎁 GIVEAWAY KẾT THÚC')
                .setColor('Red')
                .setDescription(
                    winner
                        ? `🏆 Người thắng: <@${winner}>\n🎁 Phần thưởng: **${prize}**`
                        : '❌ Không có người tham gia!'
                );

            await msg.edit({
                embeds: [endEmbed],
                components: []
            });

        }, duration * 1000);
    }
};
