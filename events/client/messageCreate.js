module.exports = (client) => {

    const chatXP = require('./chatXPHandler.js');
    const ticket = require('./ticketMessageHandler.js');
    const automod = require('./automodHandler.js');

    client.on('messageCreate', async (message) => {

        if (message.author.bot || !message.guild) return;

        chatXP(message);
        automod(message);
        ticket(message, client);

    });

};