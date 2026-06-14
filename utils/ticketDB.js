const db = require('../database/sqlite');

module.exports = {

    create(channelId, data) {

        db.prepare(`
        INSERT OR REPLACE INTO tickets
        (
            channelId,
            status,
            staffReplied,
            createdAt,
            messageId
        )
        VALUES (?, ?, ?, ?, ?)
        `).run(
            channelId,
            data.status,
            data.staffReplied ? 1 : 0,
            data.createdAt,
            data.messageId
        );
    },

    get(channelId) {

        return db.prepare(`
        SELECT *
        FROM tickets
        WHERE channelId = ?
        `).get(channelId);

    },

    update(channelId, data) {

        db.prepare(`
        UPDATE tickets
        SET
            status = ?,
            staffReplied = ?,
            createdAt = ?,
            messageId = ?
        WHERE channelId = ?
        `).run(
            data.status,
            data.staffReplied ? 1 : 0,
            data.createdAt,
            data.messageId,
            channelId
        );

    },

    delete(channelId) {

        db.prepare(`
        DELETE FROM tickets
        WHERE channelId = ?
        `).run(channelId);

    }

};