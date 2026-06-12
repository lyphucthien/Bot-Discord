const config = require('../config.json');
const fs = require('fs');
const path = require('path');

const ticketStatus = require('../utils/ticketStatus');
const cooldowns = new Map();

const levelFile = path.join(__dirname, '../data/levels.json');

// ======================
// LOAD CACHE 1 LẦN (FIX LAG)
// ======================
let levels = {};

if (fs.existsSync(levelFile)) {
    try {
        levels = JSON.parse(fs.readFileSync(levelFile, 'utf8')) || {};
    } catch (err) {
        console.error('Load level file error:', err);
    }
}

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

            if (!levels[key]) {
                levels[key] = { xp: 0, level: 1 };
            }

            const gainedXP = Math.floor(Math.random() * 15) + 5;
            levels[key].xp += gainedXP;

            const neededXP = levels[key].level * 100;

            if (levels[key].xp >= neededXP) {
                levels[key].xp -= neededXP;
                levels[key].level++;

                message.channel.send(
                    `🎉 ${message.author} Lên **Level ${levels[key].level}**!`
                );
            }

            // ======================
            // SAFE WRITE FILE
            // ======================
            try {
                fs.writeFileSync(
                    levelFile,
                    JSON.stringify(levels, null, 2)
                );
            } catch (err) {
                console.error('Write level file error:', err);
            }
        }

        // ======================
        // TICKET STAFF TRACKING
        // ======================
        const data = ticketStatus.get(message.channel.id);
        if (!data) return;

        const isStaff = message.member?.roles?.cache?.some(r =>
            helperRoles.includes(r.id)
        );

        if (!isStaff) return;
        if (data.staffReplied) return;

        data.staffReplied = true;
        data.status = 'processing';

        ticketStatus.set(message.channel.id, data);

        const messages = await message.channel.messages.fetch({ limit: 10 });
        if (!messages) return;

        const botMsg = messages.find(
            m => m.author.bot && m.embeds.length > 0
        );

        if (!botMsg) return;

        const { EmbedBuilder } = require('discord.js');
        const oldEmbed = botMsg.embeds[0];

        const desc = oldEmbed.description || '';

        const embed = EmbedBuilder.from(oldEmbed)
            .setDescription(
                `${desc}\n\n🟢 Ticket Đang Được Xử Lý`
            );

        await botMsg.edit({ embeds: [embed] }).catch(() => { });
    });
};