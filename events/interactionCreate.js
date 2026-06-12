const config = require('../config.json');

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
                            roles: [config.Helper]
                        }
                    });

                    return interaction.editReply({
                        content: `✅ Đã tạo ticket: ${channel}`
                    });
                }
            }
            if (interaction.customId === 'ticket_info') {

                return interaction.reply({
                    content:
                        `📌 **TICKET SYSTEM**\n\n` +
                        `🛠️ Support → Hỗ trợ\n` +
                        `🚨 Report → Báo cáo lỗi\n` +
                        `🛒 Order → Đặt hàng\n\n` +
                        `⏱ Thời gian phản hồi: 1–30 phút`,
                    flags: 64
                });
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

};
