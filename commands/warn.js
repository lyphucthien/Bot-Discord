const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { readDB, writeDB } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Cảnh cáo thành viên')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người bị cảnh cáo')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {

        const member = interaction.options.getMember('user');
        if (!member) {
            return interaction.reply({ content: '❌ Không tìm thấy thành viên', flags: 64 });
        }

        const data = readDB('Warn.js');

        const id = member.id;

        if (!data[id]) data[id] = 0;

        data[id]++;

        writeDB('Warn.js', data);

        return interaction.reply(`⚠️ ${member.user.tag} hiện có ${data[id]} warn`);
    }
};