const fs = require('fs');
const path = require('path');

const levelFile = path.join(__dirname, '../data/levels.json');
const ticketStatus = require('../utils/ticketStatus');
const cooldowns = new Map();

module.exports = (client) => {

    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        // ======================
        // XP SYSTEM
        // ======================
        const userId = message.author.id;
        const key = `${message.guild.id}-${userId}`;

        if (!cooldowns.has(key)) {
            cooldowns.set(key, Date.now());

            setTimeout(() => cooldowns.delete(key), 3000);

            let levels = {};

            if (fs.existsSync(levelFile)) {
                try {
                    const data = fs.readFileSync(levelFile, 'utf8');
                    levels = data ? JSON.parse(data) : {};
                } catch (err) {
                    console.error("Lỗi Đọc levels.json:", err);
                    levels = {};
                }
            }

            if (!levels[userId]) {
                levels[userId] = {
                    xp: 0,
                    level: 1
                };
            }

            const gainedXP = Math.floor(Math.random() * 15) + 5;
            levels[userId].xp += gainedXP;

            const neededXP = levels[userId].level * 100;

            if (levels[userId].xp >= neededXP) {
                levels[userId].xp -= neededXP;
                levels[userId].level++;

                message.channel.send(
                    `🎉 ${message.author} đã lên **Level ${levels[userId].level}**!`
                );
            }

            fs.writeFileSync(levelFile, JSON.stringify(levels, null, 2));
        }

        // ======================
        // TICKET STAFF TRACKING
        // ======================
        const data = ticketStatus.get(message.channel.id);
        if (!data) return;

        const isStaff = message.member?.roles?.cache?.some(r =>
            (require('../config.json').staffRoles || []).includes(r.id)
        );

        if (!isStaff) return;
        if (data.staffReplied) return;

        data.staffReplied = true;
        data.status = 'processing';

        const messages = await message.channel.messages.fetch({ limit: 10 });
        const botMsg = messages.find(m => m.author.bot && m.embeds.length > 0);

        if (!botMsg) return;

        const { EmbedBuilder } = require('discord.js');

        const oldEmbed = botMsg.embeds[0];

        const embed = EmbedBuilder.from(oldEmbed)
            .setDescription(
                oldEmbed.description +
                `\n\nTrạng thái: **Ticket đang được xử lý** 🟢`
            );

        botMsg.edit({ embeds: [embed] }).catch(() => { });
    });
};