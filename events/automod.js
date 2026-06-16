const warnDB = require('../utils/warnDB');

const spamTracker = new Map();

// ID Owner được miễn nhiễm
const OWNER_IDS = [
    "1330395226933559297"
];

module.exports = (client) => {

    const badWords = [
        "địt", "dit", "đụ", "du", "cặc", "cak",
        "cac", "lồn", "buồi", "buoi", "đéo", "deo",
        "dell", "đĩ", "đĩ chó", "óc chó", "óc cặc",
        "thằng chó", "con chó", "súc vật",
        "rác", "mất dạy", "ngu như chó", "ngu như dog",

        "fuck", "fucking", "motherfucker", "mf",
        "bitch", "asshole", "dick", "cock",
        "pussy", "slut", "whore", "bastard",
        "retard", "kys"
    ];

    client.on('messageCreate', async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const userId = message.author.id;

        // OWNER MIỄN NHIỄM
        if (OWNER_IDS.includes(userId)) return;

        // =====================
        // ANTI SPAM
        // =====================
        const spamKey = `${userId}-${message.channel.id}`;
        const now = Date.now();

        if (!spamTracker.has(spamKey)) {
            spamTracker.set(spamKey, []);
        }

        const timestamps = spamTracker.get(spamKey);

        timestamps.push(now);

        const recent = timestamps.filter(
            time => now - time < 5000
        );

        spamTracker.set(spamKey, recent);

        if (recent.length >= 5) {

            await message.delete().catch(() => { });

            try {
                await message.author.send(
                    `⚠️ Bạn đang spam trong #${message.channel.name}\n` +
                    `Vui lòng gửi tin nhắn chậm hơn.`
                );
            } catch { }

            return;
        }

        // =====================
        // BAD WORD / INVITE
        // =====================
        const content = message.content.toLowerCase();

        const detectedWord = badWords.find(word =>
            content.includes(word)
        );

        const hasBadWord = !!detectedWord;

        const hasInvite =
            content.includes('discord.gg/') ||
            content.includes('discord.com/invite/');

        if (!hasBadWord && !hasInvite) return;

        await message.delete().catch(() => { });

        const reason = hasInvite
            ? 'Gửi Link Discord Invite'
            : `Sử Dụng Từ Ngữ Bị Cấm (${detectedWord})`;

        warnDB.add(
            userId,
            client.user.id,
            reason
        );

        const warnCount = warnDB.count(userId);

        try {
            await message.author.send(
                `⚠️ Bạn đã vi phạm nội quy trong server **${message.guild.name}**.\n\n` +
                `📌 Lý Do: ${reason}\n` +
                `📊 Số Warn Hiện Tại: ${warnCount}/5`
            );
        } catch { }

        if (warnCount >= 5) {

            try {

                await message.member.timeout(
                    10 * 60 * 1000,
                    'AutoMod: 5 lần vi phạm'
                );

                warnDB.clear(userId);

                try {
                    await message.author.send(
                        '🔇 Bạn đã bị timeout 10 phút do vi phạm 5 lần.'
                    );
                } catch { }

            } catch (err) {
                console.error(err);
            }
        }
    });
};
