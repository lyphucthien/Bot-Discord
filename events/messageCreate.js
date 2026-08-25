const config = require('../config.json');
const ticketStatus = require('../utils/ticketDB');

// ======================
// HELPER ROLES SAFE
// ======================
const helperRoles = Array.isArray(config.Helper)
    ? config.Helper
    : config.Helper
        ? [config.Helper]
        : [];

module.exports = (client) => {

    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        // ======================
        // TICKET SYSTEM
        // ======================
        const data = ticketStatus.get(message.channel.id);
        if (!data) return;

        const isStaff = message.member?.roles?.cache?.some(r =>
            helperRoles.includes(r.id)
        );

        if (!isStaff) return;
        if (data.status !== 'waiting') return;

        data.status = 'processing';
        data.staffReplied = true;

        ticketStatus.set(message.channel.id, data);

        if (!data.messageId) return;

        const botMsg = await message.channel.messages
            .fetch(data.messageId)
            .catch(() => null);

        if (!botMsg?.embeds?.length) return;

        const oldEmbed = botMsg.embeds[0];

        const { EmbedBuilder } = require('discord.js');

        const embed = EmbedBuilder.from(oldEmbed).setDescription(
            oldEmbed.description.replace(
                /📊 Trạng thái: .*/,
                `📊 Trạng thái: 🟢 Ticket Đang Được Xử Lý`
            )
        );

        await botMsg.edit({ embeds: [embed] }).catch(() => { });
    });
};
