const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const fs = require('fs');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Cảnh cáo thành viên')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người Cảnh Cáo')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {

        const member =
            interaction.options.getMember(
                'user'
            );

        if (!member) {

            return interaction.reply({
                content:
                    '❌ Không tìm thấy thành viên',
                ephemeral: true
            });

        }

        const data = JSON.parse(
            fs.readFileSync(
                './data/warns.json'
            )
        );

        const id = member.id;

        if (!data[id]) {
            data[id] = 0;
        }

        data[id]++;

        fs.writeFileSync(
            './data/warns.json',
            JSON.stringify(data, null, 2)
        );

        await interaction.reply(
            `⚠️ ${member.user.tag} hiện có ${data[id]} warn`
        );

    }

};