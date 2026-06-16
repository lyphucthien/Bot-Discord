const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reload một command")
        .addStringOption(option =>
            option.setName("command")
                .setDescription("Tên command cần reload")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const ownerID = "1330395226933559297";
        if (interaction.user.id !== ownerID)
            return interaction.reply({ content: "❌ Không có quyền!", ephemeral: true });

        const cmdName = interaction.options.getString("command");
        const cmd = client.commands.get(cmdName);

        if (!cmd)
            return interaction.reply({ content: "❌ Không tìm thấy command!", ephemeral: true });

        try {
            delete require.cache[require.resolve(`../${cmdName}.js`)];

            const newCmd = require(`../${cmdName}.js`);
            client.commands.set(newCmd.data.name, newCmd);

            return interaction.reply(`✅ Reload thành công: **${cmdName}**`);
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "❌ Reload thất bại!", ephemeral: true });
        }
    }
};