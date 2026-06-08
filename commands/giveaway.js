const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {

    name: 'giveaway',

    async execute(message, args) {

        const duration =
            parseInt(args[0]);

        const prize =
            args.slice(1).join(' ');

        if (!duration || !prize) {

            return message.reply(
                'Ví dụ: .giveaway 60 Nitro'
            );

        }

        const embed = new EmbedBuilder()
            .setTitle('🎁 GIVEAWAY')
            .setDescription(
                `Phần thưởng: **${prize}**\n⏳ ${duration}s`
            )
            .setColor('Gold');

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId('join_giveaway')
                        .setLabel('Tham Gia')
                        .setEmoji('🎉')
                        .setStyle(ButtonStyle.Success)

                );

        const giveaway =
            await message.channel.send({
                embeds: [embed],
                components: [row]
            });

        setTimeout(async () => {

            const msg =
                await message.channel.messages.fetch(
                    giveaway.id
                );

            const users =
                msg.components[0]
                    ? []
                    : [];

            message.channel.send(
                `🎁 Giveaway kết thúc!`
            );

        }, duration * 1000);

    }
};