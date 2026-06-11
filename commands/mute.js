const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

function parseDuration(str) {
    // hỗ trợ: s, m, h, d
    const match = str.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute (timeout) một thành viên')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người cần mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Thời gian (vd: 10m, 1h, 1d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Lý do mute')
                .setRequired(false)
        ),

    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({
                content: '❌ Bạn Không Có Quyền!',
                flags: 64
            });
        }

        if (!member) {
            return interaction.reply({
                content: '❌ Không tìm thấy user!',
                flags: 64
            });
        }

        const duration = parseDuration(durationStr);
        if (!duration) {
            return interaction.reply({
                content: '❌ Sai định dạng! Ví dụ: 10m, 1h, 1d',
                flags: 64
            });
        }

        try {
            await member.timeout(duration, reason);

            return interaction.reply({
                content: `🔇 Đã mute **${member.user.tag}** Trong **${durationStr}**\n📝 Lý Do: ${reason}`
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: '❌ Không Thể Mute Người Chơi Này!',
                flags: 64
            });
        }
    }
};