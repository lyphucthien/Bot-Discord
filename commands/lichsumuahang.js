const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const orderDB = require('../utils/orderDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lich-su-mua-hang')
        .setDescription('Xem Lịch Sử Mua Hàng'),

    async execute(interaction) {

        const orders = orderDB.getUser(interaction.user.id);

        if (!orders.length) {
            return interaction.reply({
                content: '❌ Chưa Có Đơn Hàng Nào.',
                flags: 64
            });
        }

        const pageSize = 7;
        let page = 0;

        const totalPages =
            Math.ceil(orders.length / pageSize);

        const totalSpent = orders.reduce(
            (sum, order) =>
                sum + Number(order.price || 0),
            0
        );

        let rank = '👤 Thành Viên';

        if (totalSpent >= 100000)
            rank = '🥉 Đồng';

        if (totalSpent >= 200000)
            rank = '🥈 Bạc';

        if (totalSpent >= 500000)
            rank = '🥇 Vàng';

        if (totalSpent >= 1000000)
            rank = '💎 Kim Cương';

        if (totalSpent >= 5000000)
            rank = '👑 Đại Gia';

        function generateEmbed() {

            const start = page * pageSize;
            const current =
                orders.slice(start, start + pageSize);

            let history =
                'MÃ ĐƠN       SẢN PHẨM                GIÁ TIỀN       NGÀY MUA\n';

            current.forEach((order, index) => {

                const orderId =
                    order.orderId ||
                    `LD${String(start + index + 1)
                        .padStart(6, '0')}`;

                const date = new Date(
                    order.createdAt
                ).toLocaleDateString('vi-VN');

                history +=
                    `${orderId.padEnd(13)}` +
                    `${order.product.padEnd(25)}` +
                    `${(Number(order.price).toLocaleString('vi-VN') + 'đ').padEnd(15)}` +
                    `${date}\n`;
            });

            return new EmbedBuilder()
                .setColor('#2ECC71')
                .setAuthor({
                    name: interaction.guild.name,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle('🛒 LỊCH SỬ MUA HÀNG')
                .setThumbnail(
                    interaction.user.displayAvatarURL()
                )
                .setDescription(
                    `✨ **Thông Tin Khách Hàng** ${interaction.user}\n\n` +

                    `💰 Tổng Chi Tiêu: **${totalSpent.toLocaleString('vi-VN')}đ**\n` +
                    `🎯 Cấp Bậc: **${rank}**\n\n` +

                    `➤ Tổng Đơn Hàng Đã Mua: **${orders.length}**\n\n` +

                    `🛒 **LỊCH SỬ MUA HÀNG:**\n` +

                    `\`\`\`\n${history}\`\`\``
                )
                .setFooter({
                    text:
                        `Trang ${page + 1}/${totalPages} • Lâm Đồng Community\n`
                })
                .setTimestamp();
        }

        const getButtons = () =>
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('history_prev')
                        .setEmoji('◀️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),

                    new ButtonBuilder()
                        .setCustomId('history_next')
                        .setEmoji('▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(
                            page >= totalPages - 1
                        )
                );

        const msg = await interaction.reply({
            embeds: [generateEmbed()],
            components: [getButtons()],
            flags: 64,
            fetchReply: true
        });

        const collector =
            msg.createMessageComponentCollector({
                time: 120000
            });

        collector.on('collect', async button => {

            if (
                button.user.id !== interaction.user.id
            ) {
                return button.reply({
                    content:
                        '❌ Không Phải Bảng Của Bạn.',
                    flags: 64
                });
            }

            if (
                button.customId === 'history_prev'
            ) page--;

            if (
                button.customId === 'history_next'
            ) page++;

            await button.update({
                embeds: [generateEmbed()],
                components: [getButtons()]
            });
        });

        collector.on('end', async () => {
            try {
                await msg.edit({
                    components: []
                });
            } catch { }
        });
    }

};
