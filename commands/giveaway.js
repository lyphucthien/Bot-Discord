const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

function parseDuration(input) {

    const match = input
        .toLowerCase()
        .match(/^(\d+)(s|m|h|d|w)$/);

    if (!match) return null;

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {

        case "s":
            return value;

        case "m":
            return value * 60;

        case "h":
            return value * 60 * 60;

        case "d":
            return value * 60 * 60 * 24;

        case "w":
            return value * 60 * 60 * 24 * 7;

        default:
            return null;

    }

}
module.exports = {

    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway system')

        .addSubcommand(sub =>
            sub
                .setName('create')
                .setDescription('Tạo Giveaway')
                .addStringOption(o =>
                    o.setName('duration')
                        .setDescription('10s, 10m, 2h, 3d, 1w')
                        .setRequired(true)
                )
                .addIntegerOption(o =>
                    o.setName('winners')
                        .setDescription('Số Người Thắng')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName('prize')
                        .setDescription('Phần Thưởng')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('end')
                .setDescription('Kết Thúc Giveaway')
                .addStringOption(o =>
                    o.setName('messageid')
                        .setDescription('ID message giveaway')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('reroll')
                .setDescription('Random Lại Người Thắng Giveaway')
                .addStringOption(o =>
                    o.setName('messageid')
                        .setDescription('ID message Giveaway')
                        .setRequired(true)
                )
        )

        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        interaction.client.giveaways ??= new Map();

        const sub = interaction.options.getSubcommand();

        if (sub === "create") {
            const durationInput = interaction.options.getString('duration');

            const duration = parseDuration(durationInput);

            if (!duration) {
                return interaction.reply({
                    content: "❌ Thời gian không hợp lệ.\nVí dụ: `30s`, `10m`, `2h`, `3d`, `1w`",
                    flags: 64
                });
            }

            const winnerCount =
                interaction.options.getInteger(
                    'winners'
                );

            const prize =
                interaction.options.getString(
                    'prize'
                );

            const users = new Set();

            let ended = false;
            let timeLeft = duration;
            let interval;
            let winnersCache = [];

            function formatTime(seconds) {
                const d = Math.floor(seconds / 86400);
                seconds %= 86400;

                const h = Math.floor(seconds / 3600);
                seconds %= 3600;

                const m = Math.floor(seconds / 60);
                seconds %= 60;

                const parts = [];

                if (d) parts.push(`${d}d`);
                if (h) parts.push(`${h}h`);
                if (m) parts.push(`${m}m`);
                if (seconds) parts.push(`${seconds}s`);

                return parts.join(" ");
            }

            const buildEmbed = () =>
                new EmbedBuilder()
                    .setTitle('🎁 GIVEAWAY')
                    .setColor('Gold')
                    .setDescription(
                        [
                            `🏆 Prize: **${prize}**`,
                            `⏳ Time Left: **${formatTime(timeLeft)}**`,
                            `👥 Entries: **${users.size}**`,
                            `🏅 Winners: **${winnerCount}**`
                        ].join('\n')
                    );

            const row =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId('join')
                            .setLabel('Tham Gia')
                            .setEmoji('🎉')
                            .setStyle(ButtonStyle.Success),

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

            interval = setInterval(() => {
                timeLeft--;

                if (timeLeft <= 0) {
                    clearInterval(interval);
                }
            }, 1000);

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

                        await msg.edit({
                            embeds: [buildEmbed()]
                        }).catch(() => { });

                        return buttonInteraction.reply({
                            content:
                                '🎉 Bạn đã tham gia!',
                            flags: 64
                        });

                    }

                }
            );

            const endAt = Date.now() + duration * 1000;

            interaction.client.giveaways.set(msg.id, {
                users,
                prize,
                winnerCount,
                endAt,
                ended: false,
                lastWinners: [],
                messageId: msg.id,
                channelId: msg.channel.id,
                interval: interval
            });

            collector.on('end', async (collected, reason) => {
                if (interval) clearInterval(interval);

                if (reason === "ended") return;

                const participants = [...users];

                if (participants.length > 0) {

                    const pool = [...participants];

                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [pool[i], pool[j]] = [pool[j], pool[i]];
                    }

                    winnersCache = pool.slice(
                        0,
                        Math.min(winnerCount, pool.length)
                    );
                }

                const endEmbed = new EmbedBuilder()
                    .setTitle('🎊 GIVEAWAY ENDED')
                    .setColor('Red')
                    .setDescription(
                        winnersCache.length > 0
                            ? `🏆 Winners:\n${winnersCache.map(w => `• <@${w}>`).join('\n')}\n\n🎁 Prize: **${prize}**`
                            : '❌ Không Có Người Tham Gia'
                    );

                const giveaway = interaction.client.giveaways.get(msg.id);

                if (giveaway) {
                    giveaway.ended = true;
                    giveaway.lastWinners = winnersCache;
                    interaction.client.giveaways.set(msg.id, giveaway);
                }

                await msg.edit({
                    embeds: [endEmbed],
                    components: []
                });

            });
        }

        if (sub === "end") {

            const messageId = interaction.options.getString("messageid");

            const data = interaction.client.giveaways.get(messageId);

            if (!data) {
                return interaction.reply({
                    content: "❌ Không tìm thấy giveaway.",
                    flags: 64
                });
            }

            if (data.ended) {
                return interaction.reply({
                    content: "❌ Giveaway này đã kết thúc.",
                    flags: 64
                });
            }

            data.ended = true;

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);

            if (!msg) {
                return interaction.reply({
                    content: "❌ Không tìm thấy message.",
                    flags: 64
                });
            }

            const participants = [...data.users];

            let winners = [];

            if (participants.length > 0) {

                const pool = [...participants];

                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }

                winners = pool.slice(0, Math.min(data.winnerCount, pool.length));

            }

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("🎊 GIVEAWAY ENDED")
                .setDescription(
                    winners.length
                        ? `🏆 Winners:\n${winners.map(id => `• <@${id}>`).join("\n")}\n\n🎁 Prize: **${data.prize}**`
                        : "❌ Không Có Người Tham Gia"
                );

            data.ended = true;
            data.collector?.stop("ended");

            await msg.edit({
                embeds: [embed],
                components: []
            }).catch(() => { });

            if (winners.length) {
                await msg.reply({
                    content: `🎉 Chúc mừng ${winners.map(x => `<@${x}>`).join(" ")} đã thắng **${data.prize}**!`,
                    allowedMentions: {
                        users: winners
                    }
                });
            }

            data.lastWinners = winners;

            interaction.client.giveaways.set(messageId, data);

            return interaction.reply({
                content: "✅ Giveaway đã kết thúc.",
                flags: 64
            });

        }

        if (sub === "reroll") {

            const messageId = interaction.options.getString("messageid");

            const data = interaction.client.giveaways.get(messageId);

            if (!data) {
                return interaction.reply({
                    content: "❌ Không tìm thấy giveaway.",
                    flags: 64
                });
            }

            const excluded = data.lastWinners ?? [];

            const participants = [...data.users].filter(
                id => !excluded.includes(id)
            );

            if (participants.length === 0) {
                return interaction.reply({
                    content: "❌ Không có người tham gia.",
                    flags: 64
                });
            }

            const pool = [...participants];

            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            const winners = pool.slice(0, Math.min(data.winnerCount, pool.length));

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);

            if (!msg) {
                return interaction.reply({
                    content: "❌ Không tìm thấy message.",
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("🎊 GIVEAWAY REROLLED")
                .setColor("Blue")
                .setDescription(
                    `🏆 Winners:\n${winners.map(x => `• <@${x}>`).join("\n")}

                    🎁 Prize: **${data.prize}**`
                );

            await msg.edit({
                embeds: [embed]
            });

            data.lastWinners = winners;

            interaction.client.giveaways.set(messageId, data);

            return interaction.reply({
                content:
                    `🎉 Người thắng mới:\n${winners.map(id => `<@${id}>`).join("\n")}`,
                allowedMentions: {
                    users: winners
                }
            });

        }
    }
}
