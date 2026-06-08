const {
    PermissionsBitField
} = require('discord.js');

module.exports = {

    name: 'kick',

    async execute(message) {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.KickMembers
            )
        ) {
            return;
        }

        const member =
            message.mentions.members.first();

        if (!member) {
            return message.reply(
                'Tag người cần kick.'
            );
        }

        await member.kick();

        message.channel.send(
            `👢 ${member.user.tag} đã bị kick`
        );
    }
};