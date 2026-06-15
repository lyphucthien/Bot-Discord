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

        function generateEmbed() {

            const start = page * pageSize;
            const current =
                orders.slice(start, start + pageSize);

            let history = '';

            current.forEach((order, index) => {

                const orderId =
                    order.orderId ||
                    `BM${String(start + index + 1)
                        .padStart(6, '0')}`;

                const date = new Date(
                    order.createdAt
                ).toLocaleDateString('vi-VN');

                history +=
                    `${orderId} | ${order.product}\n` +
                    `💰 ${Number(order.price)
                        .toLocaleString('vi-VN')}đ | 📅 ${date}\n\n`;
            });

            return new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🛒 LỊCH SỬ MUA HÀNG')
                .setThumbnail(
                    interaction.user.displayAvatarURL()
                )
                .setDescription(
                    `✨ **Thông Tin Khách Hàng** ${interaction.user}\n\n` +

                    `💰 Tổng Chi Tiêu: **${totalSpent.toLocaleString('vi-VN')}đ**\n` +
                    `📦 Tổng Đơn Hàng: **${orders.length}**\n\n` +

                    `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +

                    `${history}`
                )
                .setFooter({
                    text:
                        `Trang ${page + 1}/${totalPages}`
                });
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
