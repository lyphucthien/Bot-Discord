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
                iconURL: member.user.displayAvatarURL({
                    dynamic: true
                })
            })
            .setTitle(`🎉 Chào Mừng Bạn Đến Với **${member.guild.name}**`)
            .setDescription([
                `Hi ${member}, Vui Lòng Xác Minh Người Chơi Tại <#1503613577536475176> !!`,
                ``,
                `📌 **Các lưu ý của server**`,
                `📜 Luật Server ➜ <#1503245852129493174>`,
                `🎁 Giveaway ➜ <#1503608814606487552>`,
                `💬 Kênh Chat ➜ <#1503393797680398438>`,
                `🛠️ Ticket Support ➜ <#1515926856589775100>`,
                `🛒 Ticket Oder ➜ <#1514124605936369717>`,
                `🚨 Ticket Report ➜ <#1515926642042601532>`,
            ].join('\n'))
            .setThumbnail(member.user.displayAvatarURL({
                dynamic: true,
                size: 1024
            }))
            .setImage(
                'https://cdn.discordapp.com/attachments/1515926642042601532/1515935084782420050/Panda.png?ex=6a30d010&is=6a2f7e90&hm=c8224bb9d64a75f4154cb901fff80f4faac982e70cb1d942ac360c0ac361aea0&'
            )
            .setFooter({
                text: 'Tận Hưởng Phút Giây Giải Trí Tại Server Nhé ❤️'
            });

        await channel.send({ embeds: [embed] });

    });

};
