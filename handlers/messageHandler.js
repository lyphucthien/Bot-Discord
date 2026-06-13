module.exports = (client) => {

    client.on('messageCreate', async (message) => {

        if (message.author.bot || !message.guild) return;

        // 👉 gọi automod + XP + ticket reply tách riêng
        require('./automodHandler.js')(message);
        require('./chatXPHandler.js')(message);
        require('./voiceXPHandler.js')(client);

    });

};