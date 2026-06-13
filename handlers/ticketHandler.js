const config = require('../config.json');
const ticketStatus = require('../utils/ticketStatus');

const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

const helperRoles = config.Helper ? [config.Helper] : [];

module.exports = async (interaction) => {

    /* ================= VERIFY ================= */
    if (interaction.customId === 'verify') {

        const role = interaction.guild.roles.cache.get(config.verifyRole);

        if (!role) {
            return interaction.reply({ content: '❌ Không tìm thấy role', ephemeral: true });
        }

        await interaction.member.roles.add(role);

        return interaction.reply({ content: '✅ Xác minh thành công', ephemeral: true });
    }

    /* ================= CLOSE TICKET ================= */
    if (interaction.customId === 'close_ticket') {

        const id = interaction.channel.id;
        const data = ticketStatus.get(id);

        if (!data || data.status === 'closed') {
            return interaction.reply({ content: '⚠️ Ticket đã đóng', ephemeral: true });
        }

        ticketStatus.set(id, { ...data, status: 'closed' });

        let time = 3;

        await interaction.reply({ content: `⏳ Đóng sau ${time}s`, ephemeral: true });

        const interval = setInterval(async () => {

            time--;

            if (time > 0) {
                return interaction.editReply({ content: `⏳ Đóng sau ${time}s` });
            }

            clearInterval(interval);

            await interaction.editReply({ content: '🔴 Đang đóng...' });

            setTimeout(() => {
                ticketStatus.delete(id);
                interaction.channel.delete().catch(() => { });
            }, 1000);

        }, 1000);
    }

    /* ================= RESOLVE TICKET ================= */
    if (interaction.customId === 'resolve_ticket') {

        const id = interaction.channel.id;
        const data = ticketStatus.get(id);

        if (!data?.messageId) {
            return interaction.reply({ content: '❌ Không tìm thấy message ticket', ephemeral: true });
        }

        data.status = 'resolved';
        ticketStatus.set(id, data);

        const msg = await interaction.channel.messages.fetch(data.messageId).catch(() => null);

        if (msg?.embeds?.length) {
            const old = msg.embeds[0];

            const embed = EmbedBuilder.from(old).setDescription(
                old.description + `\n📊 Trạng thái: ✅ Đã xử lý`
            );

            await msg.edit({ embeds: [embed] }).catch(() => { });
        }

        return interaction.reply({ content: '✅ Ticket đã được xử lý', ephemeral: true });
    }

    /* ================= TICKET MENU ================= */
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {

        const type = interaction.values[0];

        const existing = interaction.guild.channels.cache.find(
            c => c.name.includes(interaction.user.id)
        );

        if (existing) {
            return interaction.reply({ content: '❌ Bạn đã có ticket', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

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

        const embed = new EmbedBuilder()
            .setTitle(`🎫 ${type.toUpperCase()} Ticket`)
            .setDescription(`Staff sẽ hỗ trợ bạn sớm nhất.`)
            .setColor('Blue');

        const msg = await channel.send({
            content: `<@&${config.Helper}>`,
            embeds: [embed],
        });

        ticketStatus.set(channel.id, {
            status: 'waiting',
            messageId: msg.id
        });

        return interaction.editReply({
            content: `✅ Đã tạo ticket: ${channel}`
        });
    }
};