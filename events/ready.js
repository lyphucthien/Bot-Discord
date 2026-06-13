module.exports = (client) => {

    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} đã online`);

        const commands = await client.application.commands.fetch();

        console.log(
            "📌 Slash Commands:",
            commands.map(cmd => cmd.name).join(', ')
        );

        client.user.setActivity('Discord Bot Pro', {
            type: 3
        });
    });

};
