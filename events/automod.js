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

        if (OWNER_IDS.includes(userId)) return;

        const spamKey = `${userId}-${message.channel.id}`;
        const now = Date.now();

        if (!spamTracker.has(spamKey)) {spamTracker.set(spamKey, []);}

        const timestamps = spamTracker.get(spamKey);

        timestamps.push(now);

        const recent = timestamps.filter(time => now - time < 5000);

        spamTracker.set(spamKey, recent);

        if (recent.length >= 5) {

            await message.delete().catch(() => { });

            warnDB.add(
                userId,
                client.user.id,
                'Spam Tin Nhắn'
            );

            const warnCount = warnDB.count(userId);

            try {
                await message.author.send(
                    `⚠️ Bạn đang spam trong #${message.channel.name}\n\n` +
                    `📌 Lý Do: Spam Tin Nhắn\n` +
                    `📊 Số Warn Hiện Tại: ${warnCount}/5`
                );
            } catch { }

            if (warnCount >= 5) {

                try {

                    await message.member.timeout(
                        10 * 60 * 1000,
                        'AutoMod: Spam quá nhiều'
                    );

                    warnDB.clear(userId);

                    try {
                        await message.author.send(
                            '🔇 Bạn Đã Bị Hạn Chế 10 Phút Do Vi Phạm 5 Lần.'
                        );
                    } catch { }

                } catch (err) {
                    console.error(err);
                }
            }

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

        const hasLink =
            /(https?:\/\/|www\.)/i.test(content);

        const blockedDomains = [
            "facebook.com",
            "fb.com",
            "youtube.com",
            "youtu.be",
            "tiktok.com",
            "instagram.com"
        ];

        const hasBlockedSocial =
            blockedDomains.some(domain =>
                content.includes(domain)
            );

        if (
            !hasBadWord &&
            !hasInvite &&
            !hasLink &&
            !hasBlockedSocial
        ) return;

        await message.delete().catch(() => { });

        let reason;

        if (hasInvite) {
            reason = 'Gửi Link Mời Discord';
        }
        else if (hasBlockedSocial) {
            reason = 'Gửi Link Mạng Xã Hội';
        }
        else if (hasLink) {
            reason = 'Gửi Link Website';
        }
        else {
            reason = `Sử Dụng Từ Ngữ Bị Cấm (${detectedWord})`;
        }

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