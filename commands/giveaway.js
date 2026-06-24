const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const endingGiveaways = new Set();
const giveawayLocks = new Map();

const BONUS_ROLES = {
    "1516045762360774696": 2,
    "1516045778089410700": 3,
    "1516045780228640778": 4,
    "1516045781164101722": 5,
    "1516045781881196595": 6,
    "1516045782858465381": 7,
    "1516045783865233579": 8
};

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

function buildGiveawayEmbed(gw) {
    const totalEntries = [...gw.users.values()].reduce((a, b) => a + b, 0) || 0;
    return new EmbedBuilder()
        .setTitle("🎁 GIVEAWAY")
        .setColor("Gold")
        .setDescription(
            `🏆 Prize: **${gw.prize}**
            ⏳ Ends in: <t:${Math.floor(gw.endAt / 1000)}:R>
            👥 Entries: **${totalEntries}**
            🏅 Winners: **${gw.winnerCount}**
            📢 Ping: ${gw.roleId ? `<@&${gw.roleId}>` : "Không có"}`
        );
}

async function endGiveaway(interaction, messageId) {
    const client = interaction.client;
    const data = client.giveaways.get(messageId);

    if (!data) return "notfound";
    if (giveawayLocks.has(messageId)) return "already";
    if (data.ended || data._processingEnd) return "already";

    data._processingEnd = true;
    data.locked = true;
    client.giveaways.set(messageId, data);

    let release;
    const lockPromise = new Promise(res => release = res);
    giveawayLocks.set(messageId, lockPromise);

    try {
        const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (!msg) return "missing";

        const pool = [];

        for (const [userId, count] of data.users.entries()) {
            for (let i = 0; i < count; i++) {
                pool.push(userId);
            }
        }

        if (!pool.length) {
            data.ended = true;
            client.giveaways.set(messageId, data);
            return "empty";
        }

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const winners = pool.slice(0, data.winnerCount);

        await msg.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎊 GIVEAWAY ENDED")
                    .setColor("Red")
                    .setDescription(
                        winners.length
                            ? winners.map(x => `Người Thắng: <@${x}>`).join("\n")
                            : "❌ Không Có Người Tham Gia"
                    )
            ],
            components: []
        }).catch(() => { });

        data.ended = true;
        data.lastWinners = winners;

        client.giveaways.set(messageId, data);

        return "ok";

    } finally {
        data.locked = false;
        data._processingEnd = false;

        client.giveaways.set(messageId, data);

        giveawayLocks.delete(messageId);
        release?.();
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
                        .setDescription('Thời Gian (vd: 10s, 5m, 2h)')
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
                .addRoleOption(o =>
                    o.setName('role')
                        .setDescription('Role Sẽ Được Ping Khi Tạo')
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('Kết Thúc Giveaway')
                .addStringOption(o =>
                    o.setName('messageid')
                        .setDescription('ID Tin Nhắn Giveaway')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Random Lại Người Thắng')
                .addStringOption(o =>
                    o.setName('messageid')
                        .setDescription('ID Tin Nhắn Giveaway')
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
            const role = interaction.options.getRole('role');

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
                    🏅 Winners: **${winnerCount}**
                    📢 Ping: ${role ? `<@&${role.id}>` : "Không có"}`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('join')
                    .setLabel('Tham Gia')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎉')
            );

            await interaction.reply({
                content: "✅ Giveaway Đã Được Tạo",
                flags: 64
            });

            const msg = await interaction.channel.send({
                content: role ? `<@&${role.id}>` : null,
                embeds: [buildEmbed()],
                components: [row]
            });

            const messageId = msg.id;

            // ================= SAVE =================
            interaction.client.giveaways.set(messageId, {
                users: new Map(),
                prize,
                winnerCount,
                roleId: role?.id ?? null,
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

                if (i.customId === "join") {
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

                    let bonus = 1;

                    for (const [roleId, value] of Object.entries(BONUS_ROLES)) {
                        if (i.member.roles.cache.has(roleId)) {
                            bonus = Math.max(bonus, value);
                        }
                    }

                    gw.users.set(i.user.id, bonus);
                    interaction.client.giveaways.set(messageId, gw);

                    await i.message.edit({
                        embeds: [buildGiveawayEmbed(gw)]
                    }).catch(() => { });

                    return i.reply({
                        content: "🎉 Bạn đã tham gia giveaway!",
                        flags: 64,
                    });
                }
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
