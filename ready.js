module.exports = (client) => {

    client.once('clientReady', () => {
        console.log('📦 Events loaded');
    });

};