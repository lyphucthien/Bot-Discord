const { SlashCommandBuilder } = require("discord.js");
const { inspect } = require("util");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("Chạy code JS (Chỉ Admin)")
        .addStringOption(option =>
            option.setName("code")
                .setDescription("Code JS cần chạy")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const ownerID = "1330395226933559297";
        if (interaction.user.id !== ownerID)
            return interaction.reply({
                content: "❌ Không có quyền!",
                flags: 64
            });

        const code = interaction.options.getString("code");

        try {
            let result = eval(code);

            if (typeof result !== "string") {
                result = inspect(result, { depth: 1 });
            }

            return interaction.reply({
                content: `\`\`\`js\n${result}\n\`\`\``,
                flags: 64
            });

        } catch (err) {
            return interaction.reply({
                content: `❌ Lỗi:\n\`\`\`${err}\`\`\``,
                flags: 64
            });
        }
    }
};