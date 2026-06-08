module.exports = {
    name: 'help',

    execute(message) {

        message.channel.send(`
📖 DANH SÁCH LỆNH

!help
!clear <số>
!kick @user
!ban @user
!warn @user
        `);

    }
};