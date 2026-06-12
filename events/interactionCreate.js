const config = require('../config.json');
const ticketStatus = require('../utils/ticketStatus');
const doneCooldown = new Map();
const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = (client) => {

    // ======================
    // INTERACTIONS
    // ======================
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
            // BUTTONS
            // ======================
            if (!interaction.isButton()) return;

            // VERIFY
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

            // ĐÓNG TICKET
            if (interaction.customId === 'close_ticket') {

                const channelId = interaction.channel.id;
                const data = ticketStatus.get(channelId);

                if (!data || data.status === 'closed') {
                    return interaction.reply({
                        content: '⚠️ Ticket đã Được Đóng Rồi!',
                        flags: 64
                    });
                }

                ticketStatus.set(channelId, { status: 'closed' });

                let time = 3;

                await interaction.reply({
                    content: `⏳ Ticket Sẽ Đóng Sau **${time}...**`,
                    fetchReply: true,
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

                        setTimeout(() => {
                            ticketStatus.delete(channelId);
                            interaction.channel.delete().catch(() => { });
                        }, 1000);
                    }

                }, 1000);
            }

            // RESOLVE TICKET
            if (interaction.customId === 'resolve_ticket') {

                const channelId = interaction.channel.id;
                const data = ticketStatus.get(channelId);

                if (data) data.status = 'resolved';

                const messages = await interaction.channel.messages.fetch({ limit: 20 });
                const botMsg = messages.find(m => m.author.bot && m.embeds.length > 0);

                if (botMsg) {
                    const embed = EmbedBuilder.from(botMsg.embeds[0])
                        .setDescription(
                            botMsg.embeds[0].description +
                            `\n📊 Trạng thái: ✅ Đã Xử Lý`
                        );

                    await botMsg.edit({ embeds: [embed] }).catch(() => { });
                }

                return interaction.reply({
                    content: '✅ Ticket đã được đánh dấu xử lý',
                    flags: 64
                });
            }

            // ======================
            // TICKET MENU
            // ======================
            if (interaction.isStringSelectMenu()) {

                if (interaction.customId !== 'ticket_menu') return;

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

                await interaction.deferReply({
                    flags: 64
                });

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
                        ...(config.Helper || []).map(roleId => ({
                            id: roleId,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                            ],
                        }))
                    ]
                });

                const createdAt = Date.now();

                ticketStatus.set(channel.id, {
                    status: 'waiting',
                    staffReplied: false,
                    createdAt
                });

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
                        },
                    ]
                };

                await channel.send({
                    content: `🚨 ${(config.Helper || []).map(id => `<@&${id}>`).join(' ')} Có Ticket Mới`,
                    embeds: [embed],
                    components: [row]
                });

                return interaction.editReply({
                    content: `✅ Đã Tạo Ticket: ${channel}`
                });
            }

        } catch (err) {
            console.error(err);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content: '❌ Lỗi',
                    flags: 64
                });
            }

            return interaction.reply({
                content: '❌ Lỗi',
                flags: 64
            });
        }
    });

    // ======================
    // STAFF MESSAGE TRACKING
    // ======================
    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const data = ticketStatus.get(message.channel.id);
        if (!data) return;

        content: `🚨 ${(config.Helper || []).map(id => `<@&${id}>`).join(' ')} Có Ticket Mới`

        const isStaff = message.member?.roles?.cache?.some(r =>
            staffRoles.includes(r.id)
        );

        if (!isStaff) return;

        //đóng bằng .done
        if (message.content.toLowerCase() === '.done') {

            const channelId = message.channel.id;

            if (!data || data.status === 'closed') return;

            if (data.status === 'resolved') {
                return message.reply('⚠️ Ticket Này Đã Được Xử Lý!');
            }

            // ANTI SPAM
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
            data.staffReplied = true;

            await message.reply('✅ Ticket **Đã Được Xử Lý**, Đang Đóng...');

            const messages = await message.channel.messages.fetch({ limit: 20 });
            const botMsg = messages.find(m => m.author.bot && m.embeds.length > 0);

            if (botMsg) {
                const embed = EmbedBuilder.from(botMsg.embeds[0])
                    .setDescription(
                        botMsg.embeds[0].description +
                        `\n📊 Trạng thái: 🔴 Đã Xử Lý`
                    );

                await botMsg.edit({ embeds: [embed] }).catch(() => { });
            }

            // COUNTDOWN CLOSE
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

                    setTimeout(() => {
                        ticketStatus.delete(channelId);
                        message.channel.delete().catch(() => { });
                    }, 1000);
                }

            }, 1000);
        }
    });
};
