const ticketHandler = require('./ticketHandler/js');

module.exports = (client) => {

    client.on('interactionCreate', async (interaction) => {

        try {

            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                return command.execute(interaction, client);
            }

            if (interaction.isButton() || interaction.isStringSelectMenu()) {
                return ticketHandler(interaction, client);
            }

        } catch (err) {
            console.error(err);
        }

    });

};