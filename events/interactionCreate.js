const config = require('../config.json');
const ticketStatus = require('../utils/ticketDB');
const doneCooldown = new Map();

const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const helperRoles = config.Helper ? [config.Helper] : [];

module.exports = (client) => {

    client.on('interactionCreate', async interaction => {

        try {

            // ======================
            // SLASH COMMANDS
            // ======================
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                return command.execute(interaction, client);
            }

            // ======================
            // BUTTONS / SELECT MENU
            // ======================
            if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

            // ======================
            // VERIFY
            // ======================
            if (interaction.customId === 'verify') {

                const role = interaction.guild.roles.cache.get(config.verifyRole);

                if (!role) {
                    return interaction.reply({
                        content: '❌ Không Tìm Thấy Role',
                        flags: 64
                    });
                }

                await interaction.member.roles.add(role);

                return interaction.reply({
                    content: '✅ Xác Minh Thành Công',
                    flags: 64
                });
            }

            // ======================
            // CLOSE TICKET
            // ======================
            if (interaction.customId === 'close_ticket') {

                const channelId = interaction.channel.id;
                const data = ticketStatus.get(channelId);

                if (!data || data.status === 'closed') {
                    return interaction.reply({
                        content: '⚠️ Ticket Này Đã Được Đóng!',
                        flags: 64
                    });
                }

                ticketStatus.update(channelId, {
                    ...data,
                    status: 'closed'
                });

                let time = 3;

                await interaction.reply({
                    content: `⏳ Ticket Sẽ Đóng Sau **${time}...**`,
                    flags: 64
                });

                const interval = setInterval(async () => {

                    time--;

                    if (time > 0) {
                        await interaction.editReply({
                            content: `⏳ Ticket Sẽ Đóng Sau **${time}...**`
                        });
                    } else {
                        await interaction.editReply({
                            content: `🔴 Đang Đóng...`
                        });

                        clearInterval(interval);

                        setTimeout(async () => {
                            ticketStatus.delete(channelId);
                            await interaction.channel.delete().catch(() => { });
                        }, 1000);
                    }

                }, 1000);
            }

            // ======================
            // RESOLVE TICKET (FIXED)
            // ======================
            if (interaction.customId === 'resolve_ticket') {

                const channelId = interaction.channel.id;
                const data = ticketStatus.get(channelId);

                if (data) {
                    data.status = 'resolved';
                    ticketStatus.update(channelId, data);
                }

                // ✅ FIX: dùng messageId thay vì fetch random
                if (!data?.messageId) {
                    return interaction.reply({
                        content: '❌ Không tìm thấy ticket message',
                        flags: 64
                    });
                }

                if (!interaction.channel) {
                    return interaction.reply({
                        content: '❌ Không tìm thấy channel',
                        flags: 64
                    });
                }

                const botMsg = await interaction.channel.messages
                    .fetch(data.messageId)
                    .catch(() => null);

                if (botMsg?.embeds?.length) {

                    const old = botMsg.embeds[0];

                    const embed = EmbedBuilder.from(old).setDescription(
                        `${old.description}\n📊 Trạng thái: ✅ Đã Xử Lý`
                    );

                    await botMsg.edit({ embeds: [embed] }).catch(() => { });
                }

                return interaction.reply({
                    content: '✅ Ticket đã được đánh dấu xử lý',
                    flags: 64
                });
            }

            // ======================
            // TICKET MENU (FIXED SAVE MESSAGE ID)
            // ======================
            if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {

                const type = interaction.values[0];

                const existing = interaction.guild.channels.cache.find(
                    c => c.name.includes(interaction.user.id)
                );

                if (existing) {
                    return interaction.reply({
                        content: '❌ Bạn Đã Có Ticket Rồi!',
                        flags: 64
                    });
                }

                await interaction.deferReply({ flags: 64 });

                const channel = await interaction.guild.channels.create({
                    name: `ticket-${type}-${interaction.user.id}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                            ],
                        },
                        ...helperRoles.map(r => ({
                            id: r,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                            ],
                        }))
                    ]
                });

                await channel.send({
                    content: `🚨 <@&${config.Helper}> Có Ticket Mới Được Tạo`,
                    allowedMentions: {
                        roles: [config.Helper]
                    }
                });

                const createdAt = Date.now();

                const embed = new EmbedBuilder()
                    .setTitle(`🎫 ${type.toUpperCase()} Ticket`)
                    .setDescription(
                        `Staff sẽ hỗ trợ bạn sớm nhất.\n\n` +
                        `⏱ <t:${Math.floor(createdAt / 1000)}:F>\n` +
                        `📊 Trạng thái: 🟡 Chờ Staff Phản Hồi`
                    )
                    .setColor('Blue');

                const row = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 4,
                            label: 'Đóng Ticket',
                            custom_id: 'close_ticket',
                            emoji: '🔒'
                        }
                    ]
                };

                const ticketMsg = await channel.send({
                    embeds: [embed],
                    components: [row]
                });

                ticketStatus.create(channel.id, {
                    status: 'waiting',
                    staffReplied: false,
                    createdAt,
                    messageId: ticketMsg.id
                });

                return interaction.editReply({
                    content: `✅ Đã tạo ticket: ${channel}`
                });
            }

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content: '❌ Lỗi hệ thống',
                    flags: 64
                });
            }

            return interaction.reply({
                content: '❌ Lỗi hệ thống',
                flags: 64
            });
        }
    });

    // ======================
    // MESSAGE TRACKING (.done)
    // ======================
    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const data = ticketStatus.get(message.channel.id);
        if (!data) return;

        const isStaff = message.member?.roles?.cache?.some(r =>
            helperRoles.includes(r.id)
        );

        if (!isStaff) return;

        /* ======================
           🟢 STAFF NHẮN → PROCESSING
        ====================== */
        if (data.status === 'waiting') {

            data.status = 'processing';
            data.staffReplied = true;

            ticketStatus.update(message.channel.id, data);

            if (data.messageId) {
                if (!message.channel) return;

                const botMsg = await message.channel.messages
                    .fetch(data.messageId)
                    .catch(() => null);

                if (botMsg?.embeds?.length) {
                    const old = botMsg.embeds[0];

                    const embed = EmbedBuilder.from(old).setDescription(
                        old.description.replace(
                            /📊 Trạng thái: .*/,
                            `📊 Trạng thái: 🟢 Ticket Đang Được Xử Lý`
                        )
                    );

                    await botMsg.edit({ embeds: [embed] }).catch(() => { });
                }
            }
        }

        /* ======================
           🔴 .done → RESOLVED
        ====================== */
        if (message.content.toLowerCase() === '.done') {

            if (data.status === 'resolved') {
                return message.reply('⚠️ Ticket Này Đã Được Xử Lý!');
            }

            const staffId = message.author.id;
            const now = Date.now();

            if (doneCooldown.has(staffId)) {
                const expire = doneCooldown.get(staffId);
                if (now < expire) {
                    return message.reply('⚠️ Vui Lòng Không Spam `.done`!');
                }
            }

            doneCooldown.set(staffId, now + 5000);

            data.status = 'resolved';
            ticketStatus.update(message.channel.id, data);

            await message.reply('✅ Ticket **Đã Được Xử Lý**, Đang Đóng...');

            if (data.messageId) {
                if (!message.channel) return;

                const botMsg = await message.channel.messages
                    .fetch(data.messageId)
                    .catch(() => null);

                if (botMsg?.embeds?.length) {
                    const old = botMsg.embeds[0];

                    const embed = EmbedBuilder.from(old).setDescription(
                        old.description.replace(
                            /📊 Trạng thái: .*/,
                            `📊 Trạng thái: 🔴 Đã Xử Lý`
                        )
                    );

                    await botMsg.edit({ embeds: [embed] }).catch(() => { });
                }
            }

            let time = 3;

            const msgClose = await message.channel.send({
                content: `⏳ Đóng Sau **${time}...**`
            }).catch(() => null);

            if (!msgClose) return;

            const interval = setInterval(async () => {

                time--;

                if (time > 0) {
                    await msgClose.edit(`⏳ Đóng Sau **${time}...**`);
                } else {
                    await msgClose.edit(`🔴 Đang Đóng...`);

                    clearInterval(interval);

                    setTimeout(async () => {
                        ticketStatus.delete(message.channel.id);
                        await message.channel.delete().catch(() => { });
                    }, 1000);
                }

            }, 1000);
        }
    });
};