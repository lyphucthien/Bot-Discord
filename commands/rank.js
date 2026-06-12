const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// =====================
// CONFIG
// =====================
const levelFile = path.join(__dirname, '../data/levels.json');

const ROLE_IDS = {
    OWNER: '1503389451420696606',
    ADMIN: '1503597027735638188',
    HELPER: '1503601043722993816',
    VIP: '1503594778342850692'
};

// =====================
// XP FUNCTION
// =====================
function xpFor(level) {
    if (level <= 0) return 0;
    return level * level * 100;
}

// =====================
// BADGE DRAW FUNCTION
// =====================
function drawBadge(ctx, text, x, y, color) {
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.roundRect(x, y, 85, 24, 10);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(text, x + 10, y + 17);
}

// =====================
// LOAD LEVEL DATA
// =====================
function loadLevels() {
    if (!fs.existsSync(levelFile)) return {};
    return JSON.parse(fs.readFileSync(levelFile, 'utf8'));
}

// =====================
// MAIN COMMAND
// =====================
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Xem Thẻ Rank')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người muốn xem rank')
        ),


    async execute(interaction) {

        // =====================
        // GET USER
        // =====================
        const target =
            interaction.options.getUser('user') ||
            interaction.user;

        const userId = target.id;

        // =====================
        // LOAD LEVELS
        // =====================
        const levels = loadLevels();

        if (!levels[userId]) {
            levels[userId] = { xp: 0, level: 1 };
        }

        const data = levels[userId];

        // =====================
        // RANK CALC
        // =====================
        const leaderboard = Object.entries(levels)
            .sort((a, b) => b[1].xp - a[1].xp);

        const rank =
            leaderboard.findIndex(([id]) => id === userId) + 1;

        const totalMembers = interaction.guild.memberCount;

        // =====================
        // MEMBER DATA
        // =====================
        const member = await interaction.guild.members.fetch(userId);

        const isOwner = member.roles.cache.has(ROLE_IDS.OWNER);
        const isAdmin = member.roles.cache.has(ROLE_IDS.ADMIN);
        const isHelper = member.roles.cache.has(ROLE_IDS.HELPER);
        const isVIP = member.roles.cache.has(ROLE_IDS.VIP);

        const boosterRole = interaction.guild.roles.premiumSubscriberRole;
        const isBooster = boosterRole && member.roles.cache.has(boosterRole.id);

        const status = member.presence?.status || 'offline';

        // =====================
        // XP PROGRESS
        // =====================
        const currentXP = xpFor(data.level - 1);
        const nextXP = xpFor(data.level + 1);

        const progress = Math.max(
            0,
            Math.min(
                1,
                (data.xp - currentXP) / (nextXP - currentXP || 1)
            )
        );

        // =====================
        // CANVAS SETUP
        // =====================
        const canvas = createCanvas(1000, 320);
        const ctx = canvas.getContext('2d');

        // =====================
        // BACKGROUND
        // =====================
        const bg = ctx.createLinearGradient(0, 0, 1000, 320);
        bg.addColorStop(0, '#1e1f22');
        bg.addColorStop(1, '#2b2d31');

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1000, 320);

        // =====================
        // CARD
        // =====================
        ctx.fillStyle = '#313338';
        ctx.beginPath();
        ctx.roundRect(20, 20, 960, 280, 20);
        ctx.fill();

        // =====================
        // AVATAR
        // =====================
        const avatar = await loadImage(
            target.displayAvatarURL({ extension: 'png', size: 512 })
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 150, 80, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 60, 70, 160, 160);
        ctx.restore();


        // avatar glow
        ctx.shadowColor = '#5865F2';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(140, 150, 82, 0, Math.PI * 2);
        ctx.strokeStyle = '#5865F2';
        ctx.stroke();

        ctx.shadowBlur = 0;

        // =====================
        // STATUS DOT
        // =====================
        const colors = {
            online: '#43b581',
            idle: '#faa61a',
            dnd: '#f04747',
            offline: '#747f8d'
        };

        ctx.fillStyle = colors[status];
        ctx.beginPath();
        ctx.arc(205, 210, 10, 0, Math.PI * 2);
        ctx.fill();

        // =====================
        // USERNAME
        // =====================
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(target.username, 260, 85);

        // =====================
        // BADGES
        // =====================
        let x = 260;

        if (isOwner) drawBadge(ctx, 'OWNER', x, 105, '#f1c40f'), x += 95;
        if (isAdmin) drawBadge(ctx, 'ADMIN', x, 105, '#e74c3c'), x += 95;
        if (isHelper) drawBadge(ctx, 'HELP', x, 105, '#3498db'), x += 95;
        if (isVIP) drawBadge(ctx, 'VIP', x, 105, '#9b59b6'), x += 95;
        if (isBooster) drawBadge(ctx, 'BOOST', x, 105, '#ff73fa');

        // =====================
        // INFO TEXT
        // =====================
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';

        ctx.fillText(`TOP ${rank}`, 720, 75);
        ctx.fillText(`${totalMembers} members`, 720, 105);

        ctx.font = '24px Arial';

        ctx.fillText(`Level: ${data.level}`, 260, 170);
        ctx.fillText(`Role: ${member.roles.highest.name}`, 260, 205);
        ctx.fillText(`XP: ${data.xp}`, 260, 240);

        // =====================
        // PROGRESS BAR
        // =====================
        ctx.fillStyle = '#2b2d31';
        ctx.beginPath();
        ctx.roundRect(260, 260, 650, 22, 12);
        ctx.fill();

        const bar = ctx.createLinearGradient(260, 0, 910, 0);
        bar.addColorStop(0, '#5865f2');
        bar.addColorStop(1, '#8ea1ff');

        ctx.fillStyle = bar;
        ctx.beginPath();
        ctx.roundRect(260, 260, 650 * progress, 22, 12);
        ctx.fill();

        // =====================
        // XP TEXT
        // =====================
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';

        ctx.fillText(
            `${data.xp - currentXP} / ${nextXP - currentXP} XP`,
            260,
            305
        );

        // =====================
        // SEND IMAGE
        // =====================
        const attachment = new AttachmentBuilder(canvas.toBuffer(), {
            name: 'rank.png'
        });

        await interaction.reply({ files: [attachment] });
    }
};
