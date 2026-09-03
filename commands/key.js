const {SlashCommandBuilder,ModalBuilder,TextInputBuilder,TextInputStyle,ActionRowBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key')
        .setDescription('Xác thực Key Minecraft'),

    async execute(interaction) {

        const modal = new ModalBuilder()
            .setCustomId('keyVerifyModal')
            .setTitle('Xác Thực Key Minecraft');

        const mcInput = new TextInputBuilder()
            .setCustomId('mcUsername')
            .setLabel('Tên tài khoản Minecraft')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(16)
            .setRequired(true);

        const keyInput = new TextInputBuilder()
            .setCustomId('mcKey')
            .setLabel('Key')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Key Nhận Từ Trang Getkey')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(mcInput),
            new ActionRowBuilder().addComponents(keyInput)
        );

        await interaction.showModal(modal);
    },
};
