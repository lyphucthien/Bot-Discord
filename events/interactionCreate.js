const config = require('../config.json');
const ticketStatus = require('../utils/ticketStatus');
const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');


module.exports = (client) => {

    client.on('interactionCreate', async interaction => {

        try {

            // ======================
            // SLASH COMMANDS
            // ======================
            if (interaction.isChatInputCommand()) {

                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, client);
            }

            // ======================
            // BUTTONS + MENU
            // ======================
            if (interaction.isButton()) {

                // ===== VERIFY BUTTON =====
                if (interaction.customId === 'verify') {

                    const role = interaction.guild.roles.cache.get(config.verifyRole);

                    if (!role) {
                        return interaction.reply({
                            content: '❌ Không tìm thấy role',
                            flags: 64
                        });
                    }

                    await interaction.member.roles.add(role);

                    return interaction.reply({
                        content: '✅ Xác minh thành công',
                        flags: 64
                    });
                }

                // ========================
                // CLOSE TICKET
                // ========================
                if (interaction.customId === 'close_ticket') {

                    const channelId = interaction.channel.id;

                    ticketStatus.set(channelId, {
                        status: 'closed'
                    });

                    await interaction.reply({
                        content: 'Ticket Đã Được Được Xử Lý Xong...',
                        flags: 64
                    });

                    setTimeout(() => {
                        interaction.channel.delete().catch(() => { });
                    }, 3000);
                }
            }

            // ======================
            // TICKET MENU
            // ======================
            if (interaction.isStringSelectMenu()) {

                if (interaction.customId === 'ticket_menu') {

                    const type = interaction.values[0];

                    const existing = interaction.guild.channels.cache.find(
                        c => c.name.includes(interaction.user.id)
                    );

                    if (existing) {
                        return interaction.reply({
                            content: '❌ Bạn đã có ticket rồi!',
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
                            ...(config.staffRoles || []).map(roleId => ({
                                id: roleId,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.ReadMessageHistory,
                                ],
                            }))
                        ]
                    });

                    let title = '';
                    let color = '';

                    if (type === 'support') {
                        title = '🛠️ Support Ticket';
                        color = 'Blue';
                    }

                    if (type === 'report') {
                        title = '🚨 Report Ticket';
                        color = 'Red';
                    }

                    if (type === 'order') {
                        title = '🛒 Order Ticket';
                        color = 'Green';
                    }

                    const createdAt = Date.now();

                    ticketStatus.set(channel.id, {
                        status: 'waiting',
                        staffReplied: false,
                        createdAt
                    });

                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(
                            `Staff Sẽ Hỗ Trợ Bạn Sớm Nhất.\n` +
                            `Bấm nút 🔒 để đóng ticket.\n\n` +
                            `⏱ Thời gian tạo: <t:${Math.floor(createdAt / 1000)}:F>\n` +
                            `📊 Trạng thái: 🟡 Chờ Staff Phản Hồi`
                        )
                        .setColor(color);

                    const row = {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 4,
                                label: 'Đóng Ticket',
                                custom_id: 'close_ticket',
                                emoji: '🔒'
                            },
                            {
                                type: 2,
                                style: 3,
                                label: 'Đã xử lý',
                                custom_id: 'resolve_ticket',
                                emoji: '✅'
                            }
                        ]
                    };

                    await channel.send({
                        content: `🚨 <@&${config.Helper}> Có Ticket Mới Được Tạo!`,
                        embeds: [embed],
                        components: [row],
                        allowed_mentions: {
                            roles: [config.Helper]
                        }
                    });

                    return interaction.editReply({
                        content: `✅ Đã Tạo Ticket: ${channel}`
                    });
                }

                // ======================
                // RESOLVE BUTTON
                // ======================
                if (interaction.customId === 'resolve_ticket') {

                    const channelId = interaction.channel.id;
                    const data = ticketStatus.get(channelId);

                    if (data) data.status = 'resolved';

                    let time = 3;

                    await interaction.reply({
                        content: `Ticket Sẽ Đóng Sau **${time}...**`,
                        flags: 64
                    });

                    const interval = setInterval(async () => {

                        time--;

                        if (time > 0) {
                            await interaction.editReply({
                                content: `Ticket Sẽ Đóng Sau **${time}...**`
                            });
                        } else {
                            await interaction.editReply({
                                content: `Đang Đóng Ticket...`
                            });

                            clearInterval(interval);

                            setTimeout(() => {
                                interaction.channel.delete().catch(() => { });
                                ticketStatus.delete(channelId);
                            }, 1000);
                        }

                    }, 1000);
                }
            }

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content: '❌ Đã Xảy Ra Lỗi.',
                    flags: 64
                });
            }

            return interaction.reply({
                content: '❌ Đã Xảy Ra Lỗi.',
                flags: 64
            });
        }
    });

    // ======================
    // STAFF MESSAGE TRACKING
    // ======================
    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;

        const data = ticketStatus.get(message.channel.id);
        if (!data) return;

        const isStaff = message.member?.roles?.cache?.some(r =>
            config.staffRoles.includes(r.id)
        );

        if (!isStaff) return;
        if (data.staffReplied) return;

        data.staffReplied = true;
        data.status = 'processing';

        const messages = await message.channel.messages.fetch({ limit: 10 });
        const botMsg = messages.find(m => m.author.bot && m.embeds.length > 0);

        if (!botMsg) return;

        const embed = EmbedBuilder.from(botMsg.embeds[0])
            .setDescription(
                botMsg.embeds[0].description +
                `\n📊 Trạng thái: 🟢 Ticket Đang Được Xử Lý`
            );

        botMsg.edit({ embeds: [embed] });
    });
};
