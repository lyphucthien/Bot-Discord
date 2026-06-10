module.exports = (client) => {

    client.once('clientReady', () => {

        console.log(
            `✅ ${client.user.tag} Đã Online`
        );

    });
    
    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag}`);

        const commands = await client.application.commands.fetch();

        console.log(
            "Slash Commands:",
            commands.map(cmd => cmd.name)
        );

    });
};
