const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Danh Sách Lệnh'),

    async execute(interaction) {

        await interaction.reply(`
📖 DANH SÁCH LỆNH

/help
/ban
/kick
/clear
/giveaway
/reroll

        `);
    }
};