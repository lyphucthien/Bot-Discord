const config = require('../config.json');
const ticketStatus = require('../utils/ticketDB');
const levelDB = require('../utils/levelDB');

const cooldowns = new Map();

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
        // XP SYSTEM (FIXED)
        // ======================
        const userId = message.author.id;
        const key = `${message.guild.id}-${userId}`;

        if (!cooldowns.has(key)) {

            cooldowns.set(key, Date.now());
            setTimeout(() => cooldowns.delete(key), 3000);

            // 🔥 lấy data từ DB
            let user = levelDB.get(userId);

            const gainedXP = Math.floor(Math.random() * 15) + 5;
            user.xp += gainedXP;

            const neededXP = user.level * 100;

            if (user.xp >= neededXP) {
                user.xp -= neededXP;
                user.level++;

                message.channel.send(
                    `🎉 ${message.author} Lên **Level ${user.level}**!`
                );
            }

            levelDB.update(userId, user.xp, user.level);
        }

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