const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Gỡ Hạn Chế (Timeout)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người Cần Gỡ Hạn Chế')
                .setRequired(true)
        ),

    async execute(interaction) {
        const member = interaction.options.getMember('user');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({
                content: '❌ Bạn Không Có Quyền!',
                flags: 64
            });
        }

        if (!member) {
            return interaction.reply({
                content: '❌ Không Tìm Thấy Người Dùng!',
                flags: 64
            });
        }

        try {
            await member.timeout(null);

            return interaction.reply({
                content: `🔊 Đã Gỡ Hạn Chế **${member.user.tag}**`
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: '❌ Không Thể Gỡ Hạn Ché!',
                flags: 64
            });
        }
    }
};
