const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const state = require("../state");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("maintenance")
        .setDescription("Bật / tắt chế độ bảo trì bot")
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("on hoặc off")
                .setRequired(true)
                .addChoices(
                    { name: "ON", value: "on" },
                    { name: "OFF", value: "off" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const mode = interaction.options.getString("mode");

        if (mode === "on") {
            state.maintenance = true;

            return interaction.reply({
                content: "🔴 Đã bật chế độ BẢO TRÌ!",
                ephemeral: true
            });
        }

        if (mode === "off") {
            state.maintenance = false;

            return interaction.reply({
                content: "🟢 Đã tắt chế độ BẢO TRÌ!",
                ephemeral: true
            });
        }
    }
};