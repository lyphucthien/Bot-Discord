const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Restart Bot"),

    async execute(interaction) {
        const ownerID = "1330395226933559297";
        if (interaction.user.id !== ownerID)
            return interaction.reply({
                content: "❌ Bạn Không Có Quyền!",
                flags: 64
            });

        await interaction.reply("♻️ Đang Restart Bot...");
        flags: 64

        setTimeout(() => {
            process.exit(1);
        }, 1500);
    }
};
