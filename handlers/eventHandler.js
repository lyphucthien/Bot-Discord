module.exports = (client) => {

    require('./commandHandler.js')(client);
    require('./interactionHandler.js')(client);
    require('./messageHandler.js')(client);

};