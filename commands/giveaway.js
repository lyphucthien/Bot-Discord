const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');

function parseDuration(input) {
    const match = input.toLowerCase().match(/^(\d+)(s|m|h|d|w)$/);
    if (!match) return null;

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
        case "s": return value;
        case "m": return value * 60;
        case "h": return value * 3600;
        case "d": return value * 86400;
        case "w": return value * 604800;
        default: return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway system')

        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Tạo Giveaway')
                .addStringOption(o =>
                    o.setName('duration')
                        .setRequired(true)
                )
                .addIntegerOption(o =>
                    o.setName('winners')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName('prize')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('Kết Thúc Giveaway')
                .addStringOption(o =>
                    o.setName('messageid')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Random lại người thắng')
                .addStringOption(o =>
                    o.setName('messageid')
                        .setRequired(true)
                )
        )

        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        interaction.client.giveaways ??= new Map();

        const sub = interaction.options.getSubcommand();

        // ================= CREATE =================
        if (sub === "create") {

            const durationInput = interaction.options.getString('duration');
            const duration = parseDuration(durationInput);

            if (!duration) {
                return interaction.reply({
                    content: "❌ Sai thời gian (vd: 10s, 10m, 2h)",
                    flags: 64
                });
            }

            const winnerCount = interaction.options.getInteger('winners');
            const prize = interaction.options.getString('prize');

            const users = new Set();
            let timeLeft = duration;
            let winnersCache = [];

            const buildEmbed = () => new EmbedBuilder()
                .setTitle("🎁 GIVEAWAY")
                .setColor("Gold")
                .setDescription(
                    `🏆 Prize: **${prize}**
                    ⏳ Time: **${timeLeft}s**
                    👥 Entries: **${users.size}**
                    🏅 Winners: **${winnerCount}**`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('join')
                    .setLabel('Tham Gia')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎉')
            );

            await interaction.reply({
                content: "✅ Giveaway created",
                flags: 64
            });

            const msg = await interaction.channel.send({
                embeds: [buildEmbed()],
                components: [row]
            });

            const messageId = msg.id;

            // ================= SAVE =================
            interaction.client.giveaways.set(messageId, {
                users,
                prize,
                winnerCount,
                messageId,
                ended: false,
                lastWinners: []
            });

            // ================= COLLECT =================
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: duration * 1000
            });

            collector.on("collect", async i => {
                if (i.customId !== "join") return;

                if (users.has(i.user.id)) {
                    return i.reply({
                        content: "⚠️ Bạn Đã Tham Gia Rồi",
                        flags: 64
                    });
                }

                users.add(i.user.id);

                try {
                    await msg.edit({ embeds: [buildEmbed()] });
                } catch { }

                return i.reply({
                    content: "🎉 Bạn Đã Tham Gia!",
                    flags: 64
                });
            });

            // ================= END =================
            collector.on("end", async () => {

                const data = interaction.client.giveaways.get(messageId);
                if (!data) return;

                const participants = [...users];

                if (participants.length > 0) {
                    for (let i = participants.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [participants[i], participants[j]] = [participants[j], participants[i]];
                    }

                    winnersCache = participants.slice(0, Math.min(winnerCount, participants.length));
                }

                const endEmbed = new EmbedBuilder()
                    .setTitle("🎊 GIVEAWAY ENDED")
                    .setColor("Red")
                    .setDescription(
                        winnersCache.length
                            ? winnersCache.map(x => `• <@${x}>`).join("\n")
                            : "❌ Không Có Người Tham Gia"
                    );

                try {
                    await msg.edit({
                        embeds: [endEmbed],
                        components: []
                    });
                } catch { }

                data.ended = true;
                data.lastWinners = winnersCache;

                interaction.client.giveaways.set(messageId, data);
            });
        }

        // ================= END =================
        if (sub === "end") {

            const messageId = interaction.options.getString("messageid");

            const data = interaction.client.giveaways.get(messageId);

            if (!data) {
                return interaction.reply({
                    content: "❌ Không Tìm Thấy Giveaway",
                    flags: 64
                });
            }

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);

            if (!msg) {
                return interaction.reply({
                    content: "❌ Message Không Tồn Tại",
                    flags: 64
                });
            }

            const users = [...data.users];

            if (!users.length) {
                return interaction.reply({
                    content: "❌ Không Có Người Tham Gia",
                    flags: 64
                });
            }

            for (let i = users.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [users[i], users[j]] = [users[j], users[i]];
            }

            const winners = users.slice(0, data.winnerCount);

            const embed = new EmbedBuilder()
                .setTitle("🎊 GIVEAWAY ENDED")
                .setColor("Red")
                .setDescription(
                    winners.length
                        ? winners.map(x => `• <@${x}>`).join("\n")
                        : "❌ Không Có Người Tham Gia"
                );

            try {
                await msg.edit({ embeds: [embed], components: [] });
            } catch { }

            data.ended = true;
            data.lastWinners = winners;

            interaction.client.giveaways.set(messageId, data);

            return interaction.reply({
                content: "✅ Đã kết thúc giveaway",
                flags: 64
            });
        }

        // ================= REROLL =================
        if (sub === "reroll") {

            const messageId = interaction.options.getString("messageid");
            const data = interaction.client.giveaways.get(messageId);

            if (!data) {
                return interaction.reply({
                    content: "❌ Không tìm thấy giveaway",
                    flags: 64
                });
            }

            const pool = [...data.users];

            if (!pool.length) {
                return interaction.reply({
                    content: "❌ Không có người tham gia",
                    flags: 64
                });
            }

            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            const winners = pool.slice(0, data.winnerCount);

            const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);

            if (!msg) {
                return interaction.reply({
                    content: "❌ Message không tồn tại",
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("🎊 GIVEAWAY REROLLED")
                .setColor("Blue")
                .setDescription(
                    winners.map(x => `• <@${x}>`).join("\n")
                );

            try {
                await msg.edit({ embeds: [embed] });
            } catch { }

            data.lastWinners = winners;

            interaction.client.giveaways.set(messageId, data);

            return interaction.reply({
                content: `🎉 Winner mới: ${winners.map(x => `<@${x}>`).join(" ")}`,
                allowedMentions: { users: winners }
            });
        }
    }
};
