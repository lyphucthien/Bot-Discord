const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const ADMIN_MARKET = "1330395226933559297";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bill")
        .setDescription("Tạo Hóa Đơn")
        .addUserOption(o =>
            o.setName("user")
                .setDescription("Khách Hàng")
                .setRequired(true))
        .addStringOption(o =>
            o.setName("item")
                .setDescription("Tên Sản Phẩm")
                .setRequired(true))
        .addIntegerOption(o =>
            o.setName("quantity")
                .setDescription("Số Lượng")
                .setRequired(true))
        .addIntegerOption(o =>
            o.setName("price")
                .setDescription("Đơn Giá")
                .setRequired(true))
        .addIntegerOption(o =>
            o.setName("discount")
                .setDescription("Giảm Giá")
                .setRequired(false)),

    async execute(interaction) {

        if (interaction.user.id !== ADMIN_MARKET) {
            return interaction.reply({
                content: "❌ Bạn Không Có Quyền Sử Dụng Lệnh!",
                flags: 64
            });
        }

        const user = interaction.options.getUser("user");
        const item = interaction.options.getString("item");
        const quantity = interaction.options.getInteger("quantity");
        const price = interaction.options.getInteger("price");
        const discount = interaction.options.getInteger("discount") || 0;

        const subtotal = quantity * price;
        const total = subtotal - discount;

        const billID = "LD-" + Math.floor(Math.random() * 999999);

        const date = new Date().toLocaleDateString("vi-VN");

        const format = n =>
            n.toLocaleString("vi-VN") + "đ";

        const embed = new EmbedBuilder()
            .setColor("#2ECC71")
            .setTitle("🧾 HÓA ĐƠN THANH TOÁN")
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
                {
                    name: "👤 Khách Hàng",
                    value: `${user}`,
                    inline: true
                },
                {
                    name: "🧾 Mã Hóa Đơn",
                    value: `#${billID}`,
                    inline: true
                },
                {
                    name: "📅 Ngày",
                    value: date,
                    inline: true
                },
                {
                    name: "📦 Sản Phẩm",
                    value: item,
                    inline: true
                },
                {
                    name: "🔢 Số Lượng",
                    value: `${quantity}`,
                    inline: true
                },
                {
                    name: "💵 Đơn Giá",
                    value: format(price),
                    inline: true
                },
                {
                    name: "💰 Tạm Tính",
                    value: format(subtotal),
                    inline: true
                },
                {
                    name: "🎁 Giảm Giá",
                    value: format(discount),
                    inline: true
                },
                {
                    name: "💸 Tổng Cộng",
                    value: `**${format(total)}**`,
                    inline: true
                },
                {
                    name: "🏦 Thanh Toán",
                    value:
                        `**Ngân hàng:** Lỗ Tèng Ngầy
                        **STK:** 6767676767
                        **Chủ TK:** Lý Phúc Thiện`,
                    inline: false
                }
            )
            .setFooter({
                text: "Quét mã QR để thanh toán"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

    }
};
