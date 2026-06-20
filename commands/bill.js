const { randomUUID } = require("crypto");
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
        .addStringOption(o =>
            o.setName("note")
                .setDescription("Ghi chú")
                .setRequired(false))
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
        const note = interaction.options.getString("note") || "Không Có";

        const status = "🟡 Chưa Thanh Toán";

        const createdAt = Math.floor(Date.now() / 1000);
        const expireAt = createdAt + (15 * 60);

        if (quantity <= 0) {
            return interaction.reply({
                content: "❌ Số lượng phải lớn hơn 0!",
                flags: 64
            });
        }

        if (price <= 0) {
            return interaction.reply({
                content: "❌ Đơn giá phải lớn hơn 0!",
                flags: 64
            });
        }

        if (discount < 0) {
            return interaction.reply({
                content: "❌ Giảm giá không hợp lệ!",
                flags: 64
            });
        }

        const subtotal = quantity * price;

        if (discount > subtotal) {
            return interaction.reply({
                content: "❌ Giảm giá không được lớn hơn tạm tính!",
                flags: 64
            });
        }

        const total = subtotal - discount;

        const billID = `LD-${randomUUID().slice(0, 8).toUpperCase()}`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`payment_${billID}_${total}`)
                .setLabel("💳 Thanh Toán")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`paid_${billID}`)
                .setLabel("✅ Đã Thanh Toán")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cancel_${billID}`)
                .setLabel("❌ Hủy Hóa Đơn")
                .setStyle(ButtonStyle.Danger)
        );

        const format = n => `${n.toLocaleString("vi-VN")} ₫`;

        const embed = new EmbedBuilder()
            .setColor("#00C853")
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setTitle("🧾 HÓA ĐƠN THANH TOÁN")
            .setDescription(
                `## 👤 Khách Hàng: ${user}
                ## 📌 **TRẠNG THÁI:** ${status}

                ├────────────────────────────────────┤
                │📦 **MÃ ĐƠN:**
                │\`${billID}\`
                │
                │📦 **SẢN PHẨM:**
                │${item}
                │
                │🔢 **SỐ LƯỢNG:**
                │${quantity}
                │
                │💵 **ĐƠN GIÁ:**
                │${format(price)}
                ├────────────────────────────────────┤
                │💰 **TẠM TÍNH:** ${format(subtotal)}
                │
                │🎁 **GIẢM GIÁ:** ${format(discount)}
                ├────────────────────────────────────┤
                │💳 **TỔNG CỘNG:** ${format(total)}
                ├────────────────────────────────────┤
                │📝 **GHI CHÚ**
                │
                │${note}
                ├────────────────────────────────────┤
                │
                │🕒 **THỜI GIAN TẠO**
                │
                │<t:${createdAt}:F>
                │
                │⏳ **HẠN THANH TOÁN:** <t:${expireAt}:R>`)

            .setFooter({
                text: "Cảm Ơn Bạn Đã Tin Tưởng Và Mua Hàng Tại Máy Chủ"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

        const message = await interaction.fetchReply();

        setTimeout(async () => {

            try {

                const msg = await interaction.channel.messages.fetch(message.id);

                if (!msg) return;

                const old = msg.embeds[0];

                if (!old.description.includes("🟡 Chưa Thanh Toán"))
                    return;

                const newEmbed = EmbedBuilder
                    .from(old)
                    .setColor("Red")
                    .setDescription(
                        old.description.replace(
                            "🟡 Chưa Thanh Toán",
                            "🔴 Đã Hết Hạn"
                        )
                    );

                const row = new ActionRowBuilder();

                for (const btn of msg.components[0].components) {
                    row.addComponents(
                        ButtonBuilder.from(btn).setDisabled(true)
                    );
                }

                await msg.edit({
                    embeds: [newEmbed],
                    components: [row]
                });

            } catch { }

        }, 15 * 60 * 1000);
    }
};
