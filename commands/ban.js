const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban thành viên')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người Cần Ban')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    async execute(interaction) {

        const user =
            interaction.options.getUser('user');

        const member =
            interaction.guild.members.cache.get(
                user.id
            );

        if (!member) {
            return interaction.reply({
                content: '❌ Không tìm thấy thành viên',
                flags: 64
            });
        }

        try {
            await member.ban();

            await interaction.reply(
                `🔨 ${user.tag} đã bị ban`
            );
        } catch (err) {
            console.error(err);

            await interaction.reply({
                content: '❌ Không thể ban thành viên này',
                flags: 64
            });
        }
    }
};