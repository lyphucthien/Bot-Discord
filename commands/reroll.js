const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription(
            'Random Lại Người Thắng Giveaway'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        const data =
            interaction.client.lastGiveaway;

        if (
            !data ||
            data.winnersCache.length === 0
        ) {

            return interaction.reply({
                content:
                    '❌ Không có giveaway để reroll',
                ephemeral: true
            });

        }

        const newWinner =
            data.winnersCache[
            Math.floor(
                Math.random() *
                data.winnersCache.length
            )
            ];

        const embed = new EmbedBuilder()
            .setTitle('🔁 REROLL WINNER')
            .setColor('Blue')
            .setDescription(
                `🏆 New Winner: <@${newWinner}>\n🎁 Prize: **${data.prize}**`
            );

        await interaction.reply({
            embeds: [embed]
        });

    }

};