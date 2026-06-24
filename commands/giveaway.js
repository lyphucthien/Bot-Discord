const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const endingGiveaways = new Set();

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

async function endGiveaway(interaction, messageId) {
    const client = interaction.client;

    const data = client.giveaways.get(messageId);
    if (!data) return "notfound";

    // LOCK chống end 2 lần
    if (endingGiveaways.has(messageId) || data.locked) {
        return "already";
    }

    endingGiveaways.add(messageId);
    data.locked = true;
    client.giveaways.set(messageId, data);

    try {
        const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (!msg) return "missing";

        const users = [...data.users];

        if (!users.length) {
            data.ended = true;
            client.giveaways.set(messageId, data);
            return "empty";
        }

        // shuffle Fisher-Yates
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

        await msg.edit({ embeds: [embed], components: [] }).catch(() => { });

        data.ended = true;
        data.lastWinners = winners;

        client.giveaways.set(messageId, data);

        return "ok";

    }
    finally {
        endingGiveaways.delete(messageId);

        if (data) {
            data.locked = false;
            client.giveaways.set(messageId, data);
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway')

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
                .setDescription('Random Lại Người Thắng')
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
            let winnersCache = [];

            const buildEmbed = () => new EmbedBuilder()
                .setTitle("🎁 GIVEAWAY")
                .setColor("Gold")
                .setDescription(
                    `🏆 Prize: **${prize}**
                    ⏳ Ends in: <t:${Math.floor(Date.now() / 1000 + duration)}:R>
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
                users: new Set(),
                prize,
                winnerCount,
                messageId,
                channelId: msg.channel.id,

                endAt: Date.now() + duration * 1000,

                ended: false,
                locked: false,
                lastWinners: []
            });

            // ================= COLLECT =================
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: duration * 1000
            });

            collector.on("collect", async i => {
                if (i.customId !== "join") return;

                const gw = interaction.client.giveaways.get(messageId);

                if (!gw || gw.ended || gw.locked) {
                    return i.reply({
                        content: "Giveaway Đã Kết Thúc",
                        flags: 64
                    });
                }

                if (gw.users.has(i.user.id)) {
                    return i.reply({
                        content: "Bạn Đã Tham Gia Rồi",
                        flags: 64
                    });
                }

                gw.users.add(i.user.id);

                interaction.client.giveaways.set(messageId, gw);

                return i.reply({
                    content: "🎉 Bạn Đã Tham Gia!",
                    flags: 64
                });
            });

            // ================= END =================
            collector.on("end", async () => {
                await endGiveaway(interaction, messageId);
            });
        }

        // ================= END =================
        if (sub === "end") {
            const messageId = interaction.options.getString("messageid");

            const result = await endGiveaway(interaction, messageId);

            if (result === "notfound") {
                return interaction.reply({
                    content: "❌ Không tìm thấy giveaway",
                    flags: 64
                });
            }

            if (result === "missing") {
                return interaction.reply({
                    content: "❌ Message không tồn tại",
                    flags: 64
                });
            }

            if (result === "already") {
                return interaction.reply({
                    content: "❌ Giveaway đang xử lý hoặc đã kết thúc",
                    flags: 64
                });
            }

            if (result === "empty") {
                return interaction.reply({
                    content: "❌ Không có người tham gia",
                    flags: 64
                });
            }

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
