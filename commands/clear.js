const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Xóa Tin Nhắn")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Số Lượng Tin Nhắn Cần Xóa (1-1000)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000)
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

        await interaction.deferReply({ flags: 64 });

        let remaining = amount;
        let totalDeleted = 0;
        let hitOldMessageLimit = false;

        try {

            while (remaining > 0) {
                const batchSize = Math.min(remaining, 100);
                const deleted = await interaction.channel.bulkDelete(
                    batchSize,
                    true
                );

                totalDeleted += deleted.size;
                remaining -= batchSize;

                if (deleted.size < batchSize) {
                    hitOldMessageLimit = deleted.size > 0 || remaining < amount;
                    break;
                }

                if (remaining > 0) {
                    await new Promise(res => setTimeout(res, 1000));
                }
            }

            const note = hitOldMessageLimit
                ? "\n⚠️ Đã dừng sớm vì gặp tin nhắn cũ quá **14 ngày.**"
                : "";

            return interaction.editReply({
                content: `🧹 Đã xóa **${totalDeleted}** tin nhắn.${note}`
            });

        } catch (err) {

            console.error(err);

            return interaction.editReply({
                content:
                    `❌ Đã xóa được **${totalDeleted}** tin nhắn trước khi gặp lỗi. Có Thể Bot Thiếu Quyền hoặc bị Rate Limit.`
            });

        }
    }
};
