const db = require('../database/sqlite');

module.exports = {

    add(userId, moderatorId, reason) {

        db.prepare(`
        INSERT INTO warns
        (
            userId,
            moderatorId,
            reason,
            createdAt
        )
        VALUES (?, ?, ?, ?)
        `).run(
            userId,
            moderatorId,
            reason,
            Date.now()
        );

    },

    get(userId) {

        return db.prepare(`
        SELECT *
        FROM warns
        WHERE userId = ?
        ORDER BY id DESC
        `).all(userId);

    },

    count(userId) {

        const row = db.prepare(`
        SELECT COUNT(*) as total
        FROM warns
        WHERE userId = ?
        `).get(userId);

        return row.total;

    },

    clear(userId) {

        db.prepare(`
        DELETE FROM warns
        WHERE userId = ?
        `).run(userId);

    }

};