const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const Level = require('../utils/levelDB');

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
                .setDescription('Người muốn xem rank')
        ),

    async execute(interaction) {

        const target =
            interaction.options.getUser('user') ||
            interaction.user;

        // ======================
        // GET / CREATE USER
        // ======================
        let data = Level.get(target.id);

        if (!data) {
            Level.create(target.id);
            data = Level.get(target.id);
        }

        // ======================
        // RANK
        // ======================
        const leaderboard = Level.getLeaderboard();

        let rank =
            leaderboard.findIndex(
                u => u.userId === target.id
            ) + 1;

        if (rank <= 0) rank = leaderboard.length + 1;

        const totalMembers = interaction.guild.memberCount;

        const member = await interaction.guild.members.fetch(target.id);

        const topRole = member.roles.highest.name;

        const status =
            member.presence?.status || 'offline';

        const statusColors = {
            online: '#43B581',
            idle: '#FAA61A',
            dnd: '#F04747',
            offline: '#747F8D'
        };

        // ======================
        // XP
        // ======================
        const currentXP = data.xp;
        const nextXP = xpFor(data.level + 1);

        const progress = Math.max(
            0,
            Math.min(
                1,
                currentXP / nextXP
            )
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
        ctx.fillStyle = statusColors[status];
        ctx.beginPath();
        ctx.arc(205, 210, 12, 0, Math.PI * 2);
        ctx.fill();

        // USERNAME
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 38px Arial';
        ctx.fillText(target.username, 260, 80);

        // LEVEL
        ctx.font = '28px Arial';
        ctx.fillText(`Level: ${data.level}`, 260, 160);

        ctx.fillText(`Vai Trò: ${topRole}`, 260, 200);

        ctx.fillText(
            `${data.xp}/${xpFor(data.level + 1)} XP`,
            260,
            240
        );

        // TOP
        ctx.fillText(`TOP ${rank}`, 720, 80);
        ctx.font = '18px Arial';
        ctx.fillText(`${totalMembers} Members`, 720, 110);

        // PROGRESS BAR
        ctx.fillStyle = '#40444B';
        ctx.beginPath();
        ctx.roundRect(260, 250, 650, 25, 12);
        ctx.fill();

        ctx.fillStyle = '#5865F2';
        ctx.beginPath();
        ctx.roundRect(260, 250, 650 * progress, 25, 12);
        ctx.fill();

        const attachment = new AttachmentBuilder(canvas.toBuffer(), {
            name: 'rank.png'
        });

        return interaction.reply({
            files: [attachment]
        });
    }
};
