const cooldowns = new Set();
const addXP = require('../data/levels.json');

module.exports = {
    name: 'messageCreate',

    async execute(message) {

        if (message.author.bot) return;
        if (!message.guild) return;

        const key = `${message.guild.id}-${message.author.id}`;

        if (cooldowns.has(key)) return;

        cooldowns.add(key);

        setTimeout(() => {
            cooldowns.delete(key);
        }, 20000);

        const xp = Math.floor(Math.random() * 11) + 10;

        // add xp database
        await addXP(message.author.id, message.guild.id, xp);
    }
};