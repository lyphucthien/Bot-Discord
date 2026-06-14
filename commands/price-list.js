const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('price-list')
        .setDescription('Hiển Thị Bảng Giá'),

    async execute(interaction) {

        const filePath = path.join(__dirname, '../database/Prices.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        function buildEmbed(type, title, color) {

            const items = data[type] || [];

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(color)
                .setDescription('Danh Sách Sản Phẩm:');

            if (items.length === 0) {

                embed.addFields({
                    name: '❌ Không có dữ liệu',
                    value: 'Danh mục này hiện đang trống'
                });

                return embed;
            }

            items.forEach(item => {

                embed.addFields({
                    name: item.name,
                    value: `💰 ${item.price}`,
                    inline: true
                });

            });

            return embed;
        }

        const embeds = {
            fruits: buildEmbed('fruits', '🍎 BẢNG GIÁ TRÁI', 'Green'),
            gamepass: buildEmbed('gamepass', '🎮 BẢNG GIÁ GAMEPASS', 'Blue'),
            account: buildEmbed('account', '👤 BẢNG GIÁ ACC GAME', 'Gold')
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('fruits')
                .setLabel('🍎 Trái')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('gamepass')
                .setLabel('🎮 Gamepass')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('account')
                .setLabel('👤 Acc')
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({
            embeds: [embeds.fruits],
            components: [row]
        });

        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            time: 600000
        });

        collector.on('collect', async i => {

            if (i.customId === 'fruits') {
                return i.update({ embeds: [embeds.fruits] });
            }

            if (i.customId === 'gamepass') {
                return i.update({ embeds: [embeds.gamepass] });
            }

            if (i.customId === 'account') {
                return i.update({ embeds: [embeds.account] });
            }
        });
    }
};
