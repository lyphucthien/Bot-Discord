const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = (client) => {

    client.on('guildMemberAdd', async member => {

        const channel = member.guild.channels.cache.get(
            config.welcomeChannel
        );

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: member.user.username,
                iconURL: member.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle(
                `🎉 Chào Mừng Bạn Đến Với ${member.guild.name}`
            )
            .setDescription(
                [
                    `Hi ${member} !!`,
                    ``,
                    `📌 **Các lưu ý của server**`,
                    `📜 Luật Server: <1503245852129493174>`,
                    `🎁 Giveaway: <1503608814606487552>`,
                    `💬 Kênh Chat: <1503393797680398438>`,
                    `🛒 Các Dịch Vụ: <1503736868414427277>`,
                    `IB Các Staff Trong Server Để Được Hỗ Trợ`
                ].join('\n')
            )
            .setThumbnail(
                member.user.displayAvatarURL({
                    dynamic: true,
                    size: 1024
                })
            )
            .setImage(
                'https://cdn.discordapp.com/attachments/1503393797680398438/1514157252754411661/Panda.png?ex=6a2a5854&is=6a2906d4&hm=0c62bada8cbc273af5ef22458cfeb89a9d1cb0dd021ec62f1155420b0492f7a0&'
            )
            .setFooter({
                text: 'Tận hưởng những phút giây giải trí tại server nhé ❤️'
            });

        await channel.send({
            embeds: [embed]
        });

    });

};
