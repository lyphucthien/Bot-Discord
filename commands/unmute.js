const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Gỡ mute (timeout)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người cần unmute')
                .setRequired(true)
        ),

    async execute(interaction) {
        const member = interaction.options.getMember('user');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({
                content: '❌ Bạn không có quyền!',
                flags: 64
            });
        }

        if (!member) {
            return interaction.reply({
                content: '❌ Không tìm thấy user!',
                flags: 64
            });
        }

        try {
            await member.timeout(null);

            return interaction.reply({
                content: `🔊 Đã unmute **${member.user.tag}**`
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: '❌ Không thể unmute!',
                flags: 64
            });
        }
    }
};