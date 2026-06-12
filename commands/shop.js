const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Hiển Thị Bảng Shop'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('🛒 SHOP SERVER')
            .setDescription(
                `Chào mừng bạn đến với shop!\n\n` +
                `📦 **Dịch vụ có sẵn:**\n` +
                `• Mua Robux Chính Hãng / 120h\n` +
                `• Mua Gamepass / Fruits\n` +
                `• Acc All Game (Roblox, FF, Liên Quân)\n\n` +
                `🎫 Nhấn nút bên dưới để tạo ticket đặt hàng`
            )
            .setImage('https://i.imgur.com/your-banner.png')
            .setFooter({ text: 'Shop System • Click button to order' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket_shop')
                .setLabel('🛒 Đặt hàng')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('shop_info')
                .setLabel('ℹ️ Hướng dẫn')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};