const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const ADMIN_MARKET = [
    "1330395226933559297"
];

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

        if (!ADMIN_MARKET.includes(interaction.user.id)) {
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

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`payment_${billID}_${total}`)
                .setLabel("💳 Thanh Toán")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`paid_${billID}`)
                .setLabel("✅ Đã Thanh Toán")
                .setStyle(ButtonStyle.Danger)
        );

        const format = n => n.toLocaleString("vi-VN") + "đ";

        const embed = new EmbedBuilder()
            .setColor("#00C853")
            .setAuthor({
                name: "LPT MARKET",
                iconURL: interaction.guild.iconURL() ?? undefined
            })
            .setTitle("🧾 HÓA ĐƠN THANH TOÁN")
            .setDescription(
                `## 👤 Khách Hàng: ${user}

                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                📦 **MÃ ĐƠN:**
                \`${billID}\`

                📦 **SẢN PHẨM:**
                ${item}

                🔢 **SỐ LƯỢNG:**
                ${quantity}

                💵 **ĐƠN GIÁ:**
                ${format(price)}

                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                💰 **TẠM TÍNH:**
                ${format(subtotal)}

                🎁 **GIẢM GIÁ:**
                ${format(discount)}

                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                💳 **TỔNG CỘNG:**
                ${format(total)}
                `
            )
            .setFooter({
                text: "Cảm Ơn Bạn Đã Tin Tưởng Và Mua Hàng Tại Máy Chủ"
            })
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

    }
};
