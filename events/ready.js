module.exports = (client) => {
    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} Đã Online`);

    });
};
