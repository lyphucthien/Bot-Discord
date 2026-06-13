const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

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
            .setTitle(`🎉 Chào Mừng Bạn Đến Với **${member.guild.name}**`)
            .setDescription([
                `Hi ${member}, Vui Lòng Xác Minh Người Chơi Tại <#1503613577536475176> !!`,
                ``,
                `📌 **Các lưu ý của server**`,
                `📜 Luật Server ➜ <#1503245852129493174>`,
                `🎁 Giveaway ➜ <#1503608814606487552>`,
                `💬 Kênh Chat ➜ <#1503393797680398438>`,
                `🛒 Ticket Support, Report, Oder ➜ <#1514124605936369717>`,
            ].join('\n'))
            .setThumbnail(member.user.displayAvatarURL({
                dynamic: true,
                size: 1024
            }))
            .setImage(
                'https://cdn.discordapp.com/attachments/1503393797680398438/1514157252754411661/Panda.png'
            )
            .setFooter({
                text: 'Tận Hưởng Phút Giây Giải Trí Tại Server Nhé ❤️'
            });

        await channel.send({ embeds: [embed] });

    });

};