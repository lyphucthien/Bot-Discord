const {
    PermissionsBitField
} = require('discord.js');

module.exports = {

    name: 'clear',

    async execute(message, args) {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageMessages
            )
        ) {
            return message.reply(
                '❌ Bạn không có quyền.'
            );
        }

        const amount = parseInt(args[0]);

        if (!amount) {
            return message.reply(
                'Nhập số lượng tin nhắn.'
            );
        }

        await message.channel.bulkDelete(
            amount,
            true
        );

        message.channel.send(
            `🧹 Đã xóa ${amount} tin nhắn.`
        );
    }
};