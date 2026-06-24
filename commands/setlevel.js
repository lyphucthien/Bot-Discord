const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const levelDB = require("../utils/levelDB");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlevel")
        .setDescription("Set Level")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Người Dùng")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("level")
                .setDescription("Level")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const level = interaction.options.getInteger("level");

        levelDB.setLevel(user.id, level);

        await interaction.reply({
            content: `✅ Đã Set Level Của ${user.tag} Thành **${level}**`,
            flags: 64
        });
    }
};