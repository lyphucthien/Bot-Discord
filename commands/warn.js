const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const warnDB = require('../utils/warnDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Cảnh Cáo Thành Viên')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người Bị Cảnh Cáo')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý Do')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {

        const member =
            interaction.options.getMember('user');

        const reason =
            interaction.options.getString('reason') ||
            'Không có lý do';

        if (!member) {
            return interaction.reply({
                content: '❌ Không tìm thấy thành viên',
                flags: 64
            });
        }

        warnDB.add(
            member.id,
            interaction.user.id,
            reason
        );

        const totalWarns =
            warnDB.count(member.id);

        await interaction.reply(
            `⚠️ ${member.user.tag} đã bị cảnh cáo\n` +
            `📝 Lý do: ${reason}\n` +
            `📊 Tổng warn: ${totalWarns}`
        );
    }
};