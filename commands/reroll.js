const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'reroll',

    async execute(message) {

        const data = message.client.lastGiveaway;

        if (!data || data.winnersCache.length === 0) {
            return message.reply('❌ Không có giveaway để reroll!');
        }

        const newWinner =
            data.winnersCache[
            Math.floor(Math.random() * data.winnersCache.length)
            ];

        const embed = new EmbedBuilder()
            .setTitle('🔁 REROLL WINNER')
            .setColor('Blue')
            .setDescription(
                `🏆 New Winner: <@${newWinner}>\n🎁 Prize: **${data.prize}**`
            );

        return message.channel.send({ embeds: [embed] });
    }
};