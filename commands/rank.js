const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { readDB } = require('../utils/database');

function xpFor(level) {
    if (level <= 0) return 0;
    return level * level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Xem Thẻ Rank')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người Muốn Xem Rank')
        ),

    async execute(interaction) {

        // ======================
        // LOAD LEVEL DATA
        // ======================
        let levels = readDB('Level.js');

        const target = interaction.options.getUser('user') || interaction.user;
        const userId = target.id;

        if (!levels[userId]) {
            levels[userId] = { xp: 0, level: 1 };
        }

        const data = levels[userId];

        // ======================
        // RANK CALC
        // ======================
        const leaderboard = Object.entries(levels)
            .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0));

        const rank = leaderboard.findIndex(([id]) => id === userId) + 1 || leaderboard.length;

        const totalMembers = interaction.guild.memberCount;

        // ======================
        // MEMBER INFO
        // ======================
        let member;
        try {
            member = await interaction.guild.members.fetch(target.id);
        } catch {
            member = null;
        }

        const topRole = member?.roles?.highest?.name || 'None';
        const status = member?.presence?.status || 'offline';

        // ======================
        // XP PROGRESS
        // ======================
        const level = Math.max(1, data.level || 1);
        const xp = data.xp || 0;

        const currentXP = xpFor(level);
        const nextXP = xpFor(level + 1);

        const range = nextXP - currentXP || 1;

        const progress = Math.min(
            1,
            Math.max(0, (xp - currentXP) / range)
        );

        // ======================
        // CANVAS
        // ======================
        const canvas = createCanvas(1000, 320);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#2C2F33';
        ctx.beginPath();
        ctx.roundRect(20, 20, 960, 280, 25);
        ctx.fill();

        // AVATAR
        const avatar = await loadImage(
            target.displayAvatarURL({ extension: 'png', size: 512 })
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 150, 80, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 60, 70, 160, 160);
        ctx.restore();

        // STATUS
        const colors = {
            online: '#43B581',
            idle: '#FAA61A',
            dnd: '#F04747',
            offline: '#747F8D'
        };

        ctx.fillStyle = colors[status] || '#747F8D';
        ctx.beginPath();
        ctx.arc(205, 210, 14, 0, Math.PI * 2);
        ctx.fill();

        // USERNAME
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 38px Arial';
        ctx.fillText(target.username, 260, 80);

        // LEVEL INFO
        ctx.font = '28px Arial';
        ctx.fillText(`Level: ${level}`, 260, 165);

        ctx.font = '18px Arial';
        ctx.fillText(`Role: ${topRole}`, 260, 205);

        ctx.fillText(`${xp} XP`, 260, 245);

        // RANK
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`TOP ${rank}`, 720, 75);

        ctx.font = '18px Arial';
        ctx.fillText(`${totalMembers} Members`, 720, 105);

        // PROGRESS BAR
        ctx.fillStyle = '#40444B';
        ctx.beginPath();
        ctx.roundRect(260, 260, 650, 25, 12);
        ctx.fill();

        ctx.fillStyle = '#5865F2';
        ctx.beginPath();
        ctx.roundRect(260, 260, 650 * progress, 25, 12);
        ctx.fill();

        // OUTPUT
        const attachment = new AttachmentBuilder(
            canvas.toBuffer(),
            { name: 'rank.png' }
        );

        return interaction.reply({
            files: [attachment]
        });
    }
};