module.exports = {
    name: 'help',

    execute(message) {

        message.channel.send(`
📖 DANH SÁCH LỆNH:

.help
.clear + Số
.kick + @user
.ban + @user
.warn + @user
.giveaway + Time + Số Người Trúng + Món Quà
.reroll
        `);

    }
};
