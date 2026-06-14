const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Xóa tin nhắn')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Số Lượng')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    async execute(interaction) {

        const amount =
            interaction.options.getInteger(
                'amount'
            );

        await interaction.channel.bulkDelete(
            amount,
            true
        );

        await interaction.reply({
            content: `🧹 Đã xóa ${amount} tin nhắn`,
            flags: 64
        });
    }
};