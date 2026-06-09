const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {

    name: 'giveaway',

    async execute(message, args) {

        const duration = parseInt(args[0]);
        const winnerCount = parseInt(args[1]) || 1;
        const prize = args.slice(2).join(' ');

        if (!duration || !prize) {
            return message.reply('Cách Dùng: .giveaway + Thời Gian + Người Chiến Thắng + Phần Thưởng');
        }

        const users = new Set();

        let timeLeft = duration;
        let paused = false;
        let pausedAt = 0;

        let winnersCache = [];

        // ======================
        // EMBED
        // ======================
        const buildEmbed = () => new EmbedBuilder()
            .setTitle('🎁 GIVEAWAY')
            .setColor('Gold')
            .setDescription(
                [
                    `🏆 Prize: **${prize}**`,
                    `⏳ Time Left: **${timeLeft}s**`,
                    `👥 Entries: **${users.size}**`,
                    `🏅 Winners: **${winnerCount}**`,
                    `⏸ Trạng Thái: ${paused ? 'Paused' : 'Running'}`
                ].join('\n')
            );

        // ======================
        // BUTTONS
        // ======================
        const row = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('join')
                    .setLabel('Tham Gia')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('pause')
                    .setLabel('Tạm Dừng')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('resume')
                    .setLabel('Tiếp Tục')
                    .setStyle(ButtonStyle.Primary)
            );

        const msg = await message.channel.send({
            embeds: [buildEmbed()],
            components: [row]
        });

        // ======================
        // COLLECTOR
        // ======================
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: duration * 1000
        });

        collector.on('collect', async (interaction) => {

            const id = interaction.customId;

            // JOIN
            if (id === 'join') {

                if (users.has(interaction.user.id)) {
                    return interaction.reply({
                        content: '⚠️ Bạn đã tham gia rồi!',
                        ephemeral: true
                    });
                }

                users.add(interaction.user.id);

                return interaction.reply({
                    content: '🎉 Bạn Đã Tham Gia!',
                    ephemeral: true
                });
            }

            // PAUSE
            if (id === 'pause') {

                if (!interaction.member.permissions.has('Administrator')) {
                    return interaction.reply({ content: '❌ Không được phép', ephemeral: true });
                }

                paused = true;
                pausedAt = Date.now();

                return interaction.reply({
                    content: '⏸ Giveaway Tạm Dừng',
                    ephemeral: true
                });
            }

            // RESUME
            if (id === 'resume') {

                if (!interaction.member.permissions.has('Administrator')) {
                    return interaction.reply({ content: '❌ Không Được Phép', ephemeral: true });
                }

                paused = false;

                return interaction.reply({
                    content: '▶ Giveaway Tiếp Tục',
                    ephemeral: true
                });
            }
        });

        // ======================
        // COUNTDOWN
        // ======================
        const interval = setInterval(async () => {

            if (!paused) timeLeft--;

            if (timeLeft <= 0) {
                clearInterval(interval);
                collector.stop();
                return;
            }

            await msg.edit({ embeds: [buildEmbed()] });

        }, 1000);

        // ======================
        // END GIVEAWAY
        // ======================
        collector.on('end', async () => {

            const participants = [...users];

            if (participants.length === 0) {
                winnersCache = [];
            } else {

                const pool = [...participants];

                // shuffle
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }

                winnersCache = pool.slice(0, Math.min(winnerCount, pool.length));
            }

            const endEmbed = new EmbedBuilder()
                .setTitle('🎊 GIVEAWAY ENDED')
                .setColor('Red')
                .setDescription(
                    winnersCache.length > 0
                        ? `🏆 Winners:\n${winnersCache.map(w => `• <@${w}>`).join('\n')}\n\n🎁 Prize: **${prize}**`
                        : '❌ Không Có Người Tham Gia'
                );

            await msg.edit({
                embeds: [endEmbed],
                components: []
            });

            // attach for reroll
            message.client.lastGiveaway = {
                winnersCache,
                prize,
                channelId: message.channel.id
            };
        });
    }
};
