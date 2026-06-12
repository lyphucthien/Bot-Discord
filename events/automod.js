const fs = require('fs');
const spamTracker = new Map();

module.exports = (client) => {

    const badWords = [
        "địt", "dit", "đụ", "du", "cặc", "cak",
        "cac", "lồn", "buồi", "buoi", "đéo", "deo", "dell", "đĩ", "đĩ chó",
        "óc chó", "óc cặc", "thằng chó", "con chó", "súc vật",
        "rác", "mất dạy", "ngu như chó", "ngu như dog", "rác",

        "fuck", "fucking", "motherfucker", "mf", "bitch", "asshole", "dick",
        "cock", "pussy", "slut", "whore", "bastard", "retard", "kys"
    ];

    client.on('messageCreate', async message => {

        console.log(`${message.author.tag}: ${message.content}`);
        if (message.author.bot) return;
        if (!message.guild) return;

        const userId = message.author.id;

        const spamKey = `${userId}-${message.channel.id}`;
        const now = Date.now();

        if (!spamTracker.has(spamKey)) { spamTracker.set(spamKey, []); }

        const timestamps =
            spamTracker.get(spamKey);

        timestamps.push(now);

        const recent =
            timestamps.filter(
                time => now - time < 5000
            );

        spamTracker.set(
            spamKey,
            recent
        );

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

        const content = message.content.toLowerCase();

        const hasBadWord = badWords.some(word =>
            content.includes(word)
        );

        const hasInvite =
            content.includes('discord.gg/') ||
            content.includes('discord.com/invite/');

        if (!hasBadWord && !hasInvite) return;

        // Xóa tin nhắn vi phạm
        await message.delete().catch(() => { });

        // Đọc dữ liệu warn
        let warns = {};

        try {
            warns = JSON.parse(
                fs.readFileSync('./data/warns.json')
            );
        } catch {
            warns = {};
        }

        if (!warns[userId]) {
            warns[userId] = 0;
        }

        warns[userId]++;

        fs.writeFileSync(
            './data/warns.json',
            JSON.stringify(warns, null, 2)
        );

        // DM riêng cho người vi phạm
        try {

            await message.author.send(
                `⚠️ Bạn đã vi phạm nội quy trong server **${message.guild.name}**.\n\n` +
                `Lý Do: ${hasInvite
                    ? 'Gửi Link Discord Invite'
                    : 'Sử dụng từ ngữ bị cấm'
                }\n` +
                `Số Lần Cảnh Cáo Hiện Tại: ${warns[userId]}/5`
            );

        } catch { }

        // Timeout sau 5 warn
        if (warns[userId] >= 5) {

            try {

                await message.member.timeout(
                    10 * 60 * 1000,
                    'AutoMod: 5 lần vi phạm'
                );

                warns[userId] = 0;

                fs.writeFileSync(
                    './data/warns.json',
                    JSON.stringify(warns, null, 2)
                );

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