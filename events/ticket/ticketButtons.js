const { EmbedBuilder } = require('discord.js');
const ticketStatus = require('../../utils/ticketStatus');
const config = require('../../config.json');

module.exports = async (interaction) => {

    if (!interaction.isButton()) return;

    /* ================= VERIFY ================= */
    if (interaction.customId === 'verify') {

        const role = interaction.guild.roles.cache.get(config.verifyRole);

        if (!role) {
            return interaction.reply({
                content: '❌ Không tìm thấy role',
                ephemeral: true
            });
        }

        await interaction.member.roles.add(role);

        return interaction.reply({
            content: '✅ Xác minh thành công',
            ephemeral: true
        });
    }

    /* ================= CLOSE TICKET ================= */
    if (interaction.customId === 'close_ticket') {

        const id = interaction.channel.id;
        const data = ticketStatus.get(id);

        if (!data || data.status === 'closed') {
            return interaction.reply({
                content: '⚠️ Ticket đã đóng',
                ephemeral: true
            });
        }

        ticketStatus.set(id, { ...data, status: 'closed' });

        let time = 3;

        await interaction.reply({
            content: `⏳ Đóng sau ${time}s`,
            ephemeral: true
        });

        const interval = setInterval(async () => {

            time--;

            if (time > 0) {
                return interaction.editReply({
                    content: `⏳ Đóng sau ${time}s`
                });
            }

            clearInterval(interval);

            await interaction.editReply({
                content: `🔴 Đang đóng...`
            });

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
            return interaction.reply({
                content: '❌ Không tìm thấy message ticket',
                ephemeral: true
            });
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

        return interaction.reply({
            content: '✅ Ticket đã được xử lý',
            ephemeral: true
        });
    }

};