const { SlashCommandBuilder } = require("discord.js");

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

        const billID = "BF-" + Math.floor(Math.random() * 999999);

        const date = new Date().toLocaleDateString("vi-VN");

        const format = n =>
            n.toLocaleString("vi-VN") + "đ";

        const bill =
            `────────────────────────────────────
         HÓA ĐƠN THANH TOÁN

        🧾 Mã Hóa Đơn : #${billID}
        👤 Khách Hàng : ${user}
        📅 Ngày Tạo   : ${date}

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ${item.padEnd(30)} x${quantity}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        Tạm Tính      ${format(subtotal)}
        Giảm Giá      ${format(discount)}
        ──────────────────────────
        TỔNG CỘNG     ${format(total)}

        Ngân hàng : Lỗ Tèng Ngầy
        STK        : 6767676767
        Chủ TK     : Lý Phúc Thiện

        [ QR CODE ]

        Quét QR để thanh toán
        ────────────────────────────────────`;

        await interaction.reply({
            content: "```" + bill + "```"
        });

    }
};
