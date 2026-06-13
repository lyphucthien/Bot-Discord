module.exports = (client) => {

    require('./commandHandler')(client);
    require('./interactionHandler')(client);
    require('./messageHandler')(client);

};