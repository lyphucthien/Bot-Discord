const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Gửi bảng xác minh')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('✅ Xác Minh')
            .setDescription(
                'Nhấn nút bên dưới để xác minh.'
            )
            .setColor('Green');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('Xác Minh')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: '✅ Đã gửi bảng xác minh.',
            ephemeral: true
        });

    }

};