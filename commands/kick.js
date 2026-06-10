const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick Thành Viên')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người Cần Kick')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        ),

    async execute(interaction) {

        const user =
            interaction.options.getUser(
                'user'
            );

        const member =
            interaction.guild.members.cache.get(
                user.id
            );

        if (!member) {
            return interaction.reply({
                content: '❌ Không tìm thấy thành viên',
                ephemeral: true
            });
        }

        await member.kick();

        await interaction.reply(
            `${user.tag} đã bị kick`
        );
    }
};
