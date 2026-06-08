const config = require('../config.json');

module.exports = (client) => {

    client.on('guildMemberAdd', member => {

        const channel =
            member.guild.channels.cache.get(
                config.welcomeChannel
            );

        if (!channel) return;

        channel.send({
            content: `🎉 Chào mừng ${member} đã vào server!`
        });

    });

};