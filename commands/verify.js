const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {

    name: "verify",

    async execute(message) {

        const embed = new EmbedBuilder()
            .setTitle("✅ Xác Minh")
            .setDescription(
                "Nhấn Biểu Tượng ✅ Bên Dưới Để Xác Minh Người Chơi."
            )
            .setColor("Green");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("verify")
                    .setLabel("Xác Minh")
                    .setStyle(ButtonStyle.Success)
            );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

    }
};