const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = (client) => {

    client.on('guildMemberAdd', async member => {

        const channel = member.guild.channels.cache.get(config.welcomeChannel);

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff84f9')
            .setAuthor({
                name: member.user.username,
                iconURL: member.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle(
                `🎉 Chào Mừng Bạn Đến Với **${member.guild.name}**`
            )
            .setDescription(
                [
                    `Hi ${member}, Vui Lòng Xác Minh Người Chơi Tại <#1503613577536475176> !!`,
                    ``,
                    `📌 **Các lưu ý của server**`,
                    `📜 Luật Server ➜ <#1503245852129493174>`,
                    `🎁 Giveaway ➜ <#1503608814606487552>`,
                    `💬 Kênh Chat ➜ <#1503393797680398438>`,
                    `🛒 Ticket Đặt Hàng ➜ <#1514124605936369717>`,
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
                'https://cdn.discordapp.com/attachments/1503393797680398438/1514157252754411661/Panda.png?ex=6a2ba9d4&is=6a2a5854&hm=6a1a613a415595cfae62394675b2dfca949b27e0b23d8c2f455da0331bd564b3&'
            )
            .setFooter({
                text: 'Tận Hưởng Phút Giây Giải Trí Tại Server Nhé ❤️'
            });

        await channel.send({
            embeds: [embed]
        });

    });

};
