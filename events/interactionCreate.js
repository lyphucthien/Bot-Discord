const config = require('../config.json');

const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

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
                // ===== SHOP BUTTON =====
                // ========================
                if (interaction.customId === 'create_ticket_shop') {

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
                        name: `shop-${interaction.user.id}`,
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

                    const embed = new EmbedBuilder()
                        .setTitle('🛒 Order Ticket')
                        .setDescription(
                            'Cảm ơn bạn đã đặt hàng!\n\n' +
                            '📝 Hãy mô tả sản phẩm bạn muốn mua.\n' +
                            '💰 Staff sẽ báo giá và xử lý sớm nhất.'
                        )
                        .setColor('Green');

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

                    await channel.send({
                        content: `🛒 <@${interaction.user.id}> ticket của bạn đã được tạo!`,
                        embeds: [embed],
                        components: [row]
                    });

                    return interaction.editReply({
                        content: `✅ Đã tạo shop ticket: ${channel}`
                    });
                }


                // ========================
                // ===== SHOP INFO =====
                // ========================
                if (interaction.customId === 'shop_info') {

                    return interaction.reply({
                        content:
                            `📌 **Hướng dẫn mua hàng:**\n` +
                            `1. Nhấn "Đặt hàng"\n` +
                            `2. Mô tả sản phẩm\n` +
                            `3. Staff báo giá\n` +
                            `4. Thanh toán & nhận hàng\n\n` +
                            `⏱ Thời gian xử lý: 1–30 phút`,
                        flags: 64
                    });
                }
                // ========================
                // ===== CLOSE TICKET =====
                // ========================
                if (interaction.customId === 'close_ticket') {

                    await interaction.reply({
                        content: '🔒 Bắt đầu đóng ticket...',
                        flags: 64
                    });

                    let time = 3;

                    const interval = setInterval(async () => {

                        if (time > 0) {
                            await interaction.editReply({
                                content: `🔒 Ticket sẽ đóng sau **${time}...**`
                            });
                        } else {
                            await interaction.editReply({
                                content: `🔒 Đang đóng ticket...`
                            });

                            clearInterval(interval);

                            setTimeout(() => {
                                interaction.channel.delete().catch(() => { });
                            }, 1000);
                        }

                        time--;
                    }, 1000);
                }
            }

            // ======================
            // TICKET MENU (SELECT)
            // ======================
            if (interaction.isStringSelectMenu()) {

                if (interaction.customId === 'ticket_menu') {

                    const type = interaction.values[0];

                    // ⚡ FIX CHECK CHANNEL ĐÚNG
                    const existing = interaction.guild.channels.cache.find(
                        c => c.name.includes(interaction.user.id)
                    );

                    if (existing) {
                        return interaction.reply({
                            content: '❌ Bạn đã có ticket rồi!',
                            flags: 64
                        });
                    }

                    // ⚡ FIX LAG / TIMEOUT → deferReply
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

                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription('Staff sẽ hỗ trợ bạn sớm nhất.\nBấm nút 🔒 để đóng ticket.')
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
                            }
                        ]
                    };

                    await channel.send({
                        content: `🚨 <@&${config.Helper}> Có ticket mới được tạo!`,
                        embeds: [embed],
                        components: [row],
                        allowed_mentions: {
                            roles: [config.Helper] // ⚡ FIX ĐÚNG ROLE
                        }
                    });

                    return interaction.editReply({
                        content: `✅ Đã tạo ticket: ${channel}`
                    });
                }
            }

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content: '❌ Đã xảy ra lỗi.',
                    flags: 64
                });
            }

            return interaction.reply({
                content: '❌ Đã xảy ra lỗi.',
                flags: 64
            });
        }
    });

};
