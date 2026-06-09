const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'reroll',

    async execute(message) {

        const data = message.client.lastGiveaway;

        if (!data || data.winnersCache.length === 0) {
            return message.reply('❌ Không Có Giveaway Để Reroll!');
        }

        const newWinner =
            data.winnersCache[
            Math.floor(Math.random() * data.winnersCache.length)
            ];

        const embed = new EmbedBuilder()
            .setTitle('🔁 REROLL WINNER')
            .setColor('Blue')
            .setDescription(
                `🏆 Người Chiến Thắng Mới: <@${newWinner}>\n🎁 Phần Thưởng: **${data.prize}**`
            );

        return message.channel.send({ embeds: [embed] });
    }
};
