const {
    PermissionsBitField
} = require('discord.js');

module.exports = {

    name: 'ban',

    async execute(message) {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.BanMembers
            )
        ) {
            return;
        }

        const member =
            message.mentions.members.first();

        if (!member) {
            return message.reply(
                'Tag người cần ban.'
            );
        }

        await member.ban();

        message.channel.send(
            `🔨 ${member.user.tag} đã bị ban`
        );
    }
};