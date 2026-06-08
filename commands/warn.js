const fs = require('fs');

module.exports = {

    name: 'warn',

    execute(message) {

        const member =
            message.mentions.members.first();

        if (!member) {
            return message.reply(
                'Tag người cần warn.'
            );
        }

        const data = JSON.parse(
            fs.readFileSync(
                './data/warns.json'
            )
        );

        const id = member.id;

        if (!data[id]) {
            data[id] = 0;
        }

        data[id]++;

        fs.writeFileSync(
            './data/warns.json',
            JSON.stringify(data, null, 2)
        );

        message.channel.send(
            `⚠️ ${member.user.tag} hiện có ${data[id]} warn`
        );
    }
};