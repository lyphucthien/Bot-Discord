module.exports = (client) => {

    const chatXP = require('./chatXPHandler');
    const ticket = require('./ticketMessageHandler');
    const automod = require('./automodHandler');

    client.on('messageCreate', async (message) => {

        if (message.author.bot || !message.guild) return;

        chatXP(message);
        automod(message);
        ticket(message, client);

    });

};