module.exports = (client) => {
    client.once('clientReady', async () => {

        console.log(`✅ ${client.user.tag} Đã Online`);

        const commands = await client.application.commands.fetch();
        const channel = guild.channels.cache.get('1514454494119858206');

        await channel.setName('TEST OWNER');
        console.log(
            "Slash Commands:",
            commands.map(cmd => cmd.name)
        );

    });
};
