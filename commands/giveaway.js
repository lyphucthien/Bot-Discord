const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Tạo Giveaway')

        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Thời Gian (s)')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('winners')
                .setDescription('Số Người Thắng')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('prize')
                .setDescription('Phần Thưởng')
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        const duration =
            interaction.options.getInteger(
                'duration'
            );

        const winnerCount =
            interaction.options.getInteger(
                'winners'
            );

        const prize =
            interaction.options.getString(
                'prize'
            );

        const users = new Set();

        let timeLeft = duration;

        let paused = false;

        let winnersCache = [];

        const buildEmbed = () =>
            new EmbedBuilder()
                .setTitle('🎁 GIVEAWAY')
                .setColor('Gold')
                .setDescription(
                    [
                        `🏆 Prize: **${prize}**`,
                        `⏳ Time Left: **${timeLeft}s**`,
                        `👥 Entries: **${users.size}**`,
                        `🏅 Winners: **${winnerCount}**`,
                        `⏸ Trạng Thái: ${paused ? 'Tạm Dừng' : 'Tiếp Tục'}`
                    ].join('\n')
                );

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId('join')
                        .setLabel('Tham Gia')
                        .setEmoji('🎉')
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setLabel('Tạm Dừng')
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId('resume')
                        .setLabel('Tiếp Tục')
                        .setStyle(
                            ButtonStyle.Primary
                        )

                );

        await interaction.reply({
            content: '✅ Giveaway đã được tạo.',
            flags: 64
        });

        const msg =
            await interaction.channel.send({

                embeds: [buildEmbed()],
                components: [row]

            });

        const collector =
            msg.createMessageComponentCollector({

                componentType:
                    ComponentType.Button,

                time: duration * 1000

            });

        collector.on(
            'collect',
            async buttonInteraction => {

                const id =
                    buttonInteraction.customId;

                if (id === 'join') {

                    if (
                        users.has(
                            buttonInteraction.user.id
                        )
                    ) {

                        return buttonInteraction.reply({
                            content:
                                '⚠️ Bạn đã tham gia rồi!',
                            flags: 64
                        });

                    }

                    users.add(
                        buttonInteraction.user.id
                    );

                    return buttonInteraction.reply({
                        content:
                            '🎉 Bạn đã tham gia Giveaway!',
                        flags: 64
                    });

                }

                if (id === 'pause') {

                    if (
                        !buttonInteraction.member.permissions.has(
                            PermissionFlagsBits.Administrator
                        )
                    ) {

                        return buttonInteraction.reply({
                            content:
                                '❌ Không được phép',
                            flags: 64
                        });

                    }

                    paused = true;

                    return buttonInteraction.reply({
                        content:
                            '⏸ Giveaway đã tạm dừng',
                        flags: 64
                    });

                }

                if (id === 'resume') {

                    if (
                        !buttonInteraction.member.permissions.has(
                            PermissionFlagsBits.Administrator
                        )
                    ) {

                        return buttonInteraction.reply({
                            content:
                                '❌ Không được phép',
                            flags: 64
                        });

                    }

                    paused = false;

                    return buttonInteraction.reply({
                        content:
                            '▶ Giveaway tiếp tục',
                        flags: 64
                    });

                }

            }
        );

        const interval = setInterval(
            async () => {

                if (!paused) {

                    timeLeft--;

                }

                if (timeLeft <= 0) {

                    clearInterval(
                        interval
                    );

                    collector.stop();

                    return;

                }

                await msg.edit({

                    embeds: [
                        buildEmbed()
                    ]

                });

            },
            1000
        );

        collector.on(
            'end',
            async () => {

                const participants =
                    [...users];

                if (
                    participants.length === 0
                ) {

                    winnersCache = [];

                } else {

                    const pool =
                        [...participants];

                    for (
                        let i =
                            pool.length - 1;
                        i > 0;
                        i--
                    ) {

                        const j =
                            Math.floor(
                                Math.random() *
                                (i + 1)
                            );

                        [
                            pool[i],
                            pool[j]
                        ] = [
                                pool[j],
                                pool[i]
                            ];

                    }

                    winnersCache =
                        pool.slice(
                            0,
                            Math.min(
                                winnerCount,
                                pool.length
                            )
                        );

                }

                const endEmbed =
                    new EmbedBuilder()
                        .setTitle(
                            '🎊 GIVEAWAY ENDED'
                        )
                        .setColor('Red')
                        .setDescription(

                            winnersCache.length > 0

                                ? `🏆 Winners:\n${winnersCache
                                    .map(
                                        w =>
                                            `• <@${w}>`
                                    )
                                    .join(
                                        '\n'
                                    )}\n\n🎁 Prize: **${prize}**`

                                : '❌ Không có người tham gia'

                        );

                await msg.edit({

                    embeds: [endEmbed],
                    components: []

                });

                interaction.client.lastGiveaway = {

                    winnersCache,
                    prize,
                    channelId:
                        interaction.channel.id

                };

            }
        );

    }

};
