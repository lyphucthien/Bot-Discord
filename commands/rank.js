const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

const { createCanvas, loadImage } = require('canvas');

const fs = require('fs');
const path = require('path');

const levelFile = path.join(
    __dirname,
    '../data/levels.json'
);

function xpFor(level) {
    if (level <= 0) return 0;
    return level * level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Xem Thẻ Rank')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người Mùng Muốn Xem Rank')
        ),

    async execute(interaction) {

        let levels = {};

        if (fs.existsSync(levelFile)) {
            levels = JSON.parse(
                fs.readFileSync(levelFile, 'utf8')
            );
        }

        const target =
            interaction.options.getUser('user') ||
            interaction.user;

        const userId = target.id;

        if (!levels[userId]) {
            levels[userId] = {
                xp: 0,
                level: 1
            };
        }

        const data = levels[userId];

        // Rank
        const leaderboard = Object.entries(levels)
            .sort((a, b) => b[1].xp - a[1].xp);

        const rank =
            leaderboard.findIndex(
                ([id]) => id === userId
            ) + 1;

        const totalMembers =
            interaction.guild.memberCount;

        // Member Info
        const member = await interaction.guild.members.fetch(
            target.id
        );

        const topRole =
            member.roles.highest.name;
        const OWNER_ROLE_ID =
            '1503389451420696606';

        const ADMIN_ROLE_ID =
            '1503597027735638188';

        const HELPER_ROLE_ID =
            '1503601043722993816';

        const boosterRole =
            interaction.guild.roles.premiumSubscriberRole;

        const VIP_ROLE_ID =
            '1503594778342850692';

        const isOwner =
            member.roles.cache.has(
                OWNER_ROLE_ID
            );

        const isAdmin =
            member.roles.cache.has(
                ADMIN_ROLE_ID
            );

        const isHelper =
            member.roles.cache.has(
                HELPER_ROLE_ID
            );

        const isVIP =
            member.roles.cache.has(
                VIP_ROLE_ID
            );

        const isBooster =
            boosterRole &&
            member.roles.cache.has(
                boosterRole.id
            );

        const status =
            member.presence?.status ||
            'offline';

        // XP
        const currentXP =
            xpFor(data.level - 1);

        const nextXP =
            xpFor(data.level + 1);

        const progress = Math.max(
            0,
            Math.min(
                1,
                (data.xp - currentXP) /
                (nextXP - currentXP)
            )
        );

        // Canvas
        const canvas =
            createCanvas(1000, 320);

        const ctx =
            canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#23272A';
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Card
        ctx.fillStyle = '#2C2F33';

        ctx.beginPath();
        ctx.roundRect(
            20,
            20,
            960,
            280,
            25
        );
        ctx.fill();

        // Avatar
        const avatar =
            await loadImage(
                target.displayAvatarURL({
                    extension: 'png',
                    size: 512
                })
            );

        // Glow Avatar
        ctx.shadowColor = '#5865F2';
        ctx.shadowBlur = 35;

        ctx.beginPath();
        ctx.arc(
            140,
            150,
            85,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = '#5865F2';
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.save();

        ctx.beginPath();
        ctx.arc(
            140,
            150,
            80,
            0,
            Math.PI * 2
        );

        ctx.closePath();
        ctx.clip();

        ctx.drawImage(
            avatar,
            60,
            70,
            160,
            160
        );

        ctx.restore();

        // Status Dot
        const statusColors = {
            online: '#43B581',
            idle: '#FAA61A',
            dnd: '#F04747',
            offline: '#747F8D'
        };

        ctx.fillStyle =
            statusColors[status];

        ctx.beginPath();
        ctx.arc(
            205,
            210,
            18,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Username
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 38px Sans';

        ctx.fillText(
            target.username,
            260,
            80
        );

        // Badges
        let badgeX = 260;

        if (isOwner) {

            ctx.fillStyle = '#ffd700';

            ctx.beginPath();
            ctx.roundRect(
                badgeX,
                95,
                100,
                28,
                8
            );
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px Sans';

            ctx.fillText(
                'OWNER',
                badgeX + 12,
                115
            );

            badgeX += 120;
        }

        if (isAdmin) {

            ctx.fillStyle = '#ff1744';

            ctx.beginPath();
            ctx.roundRect(
                badgeX,
                95,
                100,
                28,
                8
            );
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';

            ctx.fillText(
                'ADMIN',
                badgeX + 12,
                115
            );

            badgeX += 120;
        }

        if (isHelper) {

            ctx.fillStyle = '#2979ff';

            ctx.beginPath();
            ctx.roundRect(
                badgeX,
                95,
                110,
                28,
                8
            );
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';

            ctx.fillText(
                'HELPER',
                badgeX + 10,
                115
            );

            badgeX += 130;
        }

        if (isVIP) {

            ctx.fillStyle = '#d500f9';

            ctx.beginPath();
            ctx.roundRect(
                badgeX,
                95,
                80,
                28,
                8
            );
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.font = '18px Sans';

            ctx.fillText(
                'VIP',
                badgeX + 22,
                115
            );

            badgeX += 100;
        }

        if (isBooster) {

            ctx.fillStyle = '#fda8fa';

            ctx.beginPath();
            ctx.roundRect(
                badgeX,
                95,
                120,
                28,
                8
            );
            ctx.fill();

            ctx.fillStyle = '#000000';

            ctx.fillText(
                'Người Đzai',
                badgeX + 12,
                115
            );
        }

        // Rank
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Sans';

        ctx.fillText(
            `TOP ${rank}`,
            720,
            75
        );

        ctx.font = '18px Sans';

        ctx.fillText(
            `${totalMembers} Members`,
            720,
            105
        );

        // Level
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Sans';

        ctx.fillText(
            `Level: ${data.level}`,
            260,
            165
        );

        // Role
        ctx.fillText(
            `${topRole}`,
            260,
            205
        );

        // XP
        ctx.fillText(
            `${data.xp} XP`,
            260,
            245
        );

        // Progress Background
        ctx.fillStyle = '#40444B';

        ctx.beginPath();
        ctx.roundRect(
            260,
            260,
            650,
            25,
            12
        );
        ctx.fill();

        // Progress Fill
        ctx.fillStyle = '#5865F2';

        ctx.beginPath();
        ctx.roundRect(
            260,
            260,
            650 * progress,
            25,
            12
        );
        ctx.fill();

        // XP Progress Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Sans';

        ctx.fillText(
            `${data.xp - currentXP} / ${nextXP - currentXP} XP`,
            260,
            305
        );

        const attachment =
            new AttachmentBuilder(
                canvas.toBuffer(),
                {
                    name: 'rank.png'
                }
            );

        await interaction.reply({
            files: [attachment]
        });
    }
};
