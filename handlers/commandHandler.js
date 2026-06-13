module.exports = (client) => {

    client.commands = new Map();

    for (const cmd of client.commandsArray || []) {
        client.commands.set(cmd.data.name, cmd);
    }

};