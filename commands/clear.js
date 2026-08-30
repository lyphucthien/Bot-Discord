const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Xóa Tin Nhắn")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Số Lượng Tin Nhắn Cần Xóa (1-100)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    async execute(interaction) {

        const amount = interaction.options.getInteger("amount");

        if (
            !interaction.guild.members.me.permissions.has(
                PermissionFlagsBits.ManageMessages
            )
        ) {
            return interaction.reply({
                content: "❌ Bot Không Có Quyền **Manage Messages**.",
                flags: 64
            });
        }

        try {

            const deleted = await interaction.channel.bulkDelete(
                amount,
                true
            );

            return interaction.reply({
                content: `🧹 Đã xóa **${deleted.size}** tin nhắn.`,
                flags: 64
            });

        } catch (err) {

            console.error(err);

            return interaction.reply({
                content:
                    `❌ Không Thể Xóa **${deleted.size}** Tin Nhắn. Có Thể Các Tin Nhắn Đã Quá 14 Ngày Hoặc Bot Thiếu Quyền.`,
                flags: 64
            });

        }
    }
};