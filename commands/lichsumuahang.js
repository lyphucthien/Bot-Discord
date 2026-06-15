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

        const pageSize = 10;
        let page = 0;

        const totalPages =
            Math.ceil(orders.length / pageSize);

        const totalSpent = orders.reduce(
            (sum, order) =>
                sum + Number(order.price || 0),
            0
        );
        
        const member = interaction.guild.members.cache.get(userId);
        
        let rank = '👤 Thành Viên';

        if (totalSpent >= 5000)
            rank = `<@&1516035637118107678>`;
        else if (totalSpent >= 50000)
            rank = `<@&1516035775240867961>`;
        else if (totalSpent >= 100000)
            rank = `<@&1516045762360774696>`;
        else if (totalSpent >= 200000)
            rank = `<@&1516045778089410700>`;
        else if (totalSpent >= 500000)
            rank = `<@&1516045780228640778>`;
        else if (totalSpent >= 1000000)
            rank = `<@&1516045781164101722>`;
        else if (totalSpent >= 2000000)
            rank = `<@&1516045781881196595>`;
        else if (totalSpent >= 5000000)
            rank = `<@&1516045782858465381>`;
        else if (totalSpent >= 10000000)
            rank = `<@&1516045783865233579>`;

        function generateEmbed() {

            const start = page * pageSize;
            const current =
                orders.slice(start, start + pageSize);

            let history =
                '**MÃ ĐƠN**　　　**Sản phẩm**　　　**Giá tiền**　　　**Ngày mua**\n';

            current.forEach(order => {

                const date = new Date(
                    order.createdAt
                ).toLocaleDateString('vi-VN');

                const price =
                    Number(order.price).toLocaleString('vi-VN') + 'đ';

                history +=
                    `${order.orderId}　　　${order.product}　　　${price}　　　${date}\n`;
            });

            return new EmbedBuilder()
                .setColor('#2ECC71')
                .setAuthor({
                    name: interaction.guild.name,
                    iconURL: interaction.guild.iconURL()
                })
                .setThumbnail(
                    interaction.user.displayAvatarURL()
                )
                .setDescription(
                    `## ✨ Thông Tin Khách Hàng ${interaction.user}\n\n` +

                    `> 💰 **Tổng Chi Tiêu:** ${totalSpent.toLocaleString('vi-VN')}đ\n` +
                    `> 🎯 **Cấp Bậc:** ${rank}\n\n` +

                    `### ➤ Đơn hàng đã mua: ${orders.length} 🛒\n\n` +

                    `### 🧾 LỊCH SỬ MUA HÀNG\n\n` +
                    `${history}`
                )
                .setFooter({
                    text:
                        `Trang ${page + 1}/${totalPages} - Lâm Đồng Community`
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

        await interaction.reply({
            embeds: [generateEmbed()],
            components: [getButtons()],
        });

        const msg = await interaction.fetchReply();

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
