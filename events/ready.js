module.exports = (client) => {

    client.once('clientReady', () => {

        console.log(
            `✅ ${client.user.tag} Đã Online`
        );

    });

};