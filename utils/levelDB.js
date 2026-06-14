const db = require('../database/sqlite');

module.exports = {

    get(userId) {

        let user = db.prepare(`
            SELECT *
            FROM users
            WHERE userId = ?
        `).get(userId);

        if (!user) {

            this.create(userId);

            user = db.prepare(`
                SELECT *
                FROM users
                WHERE userId = ?
            `).get(userId);
        }

        return user;
    },

    create(userId) {

        db.prepare(`
            INSERT OR IGNORE INTO users
            (
                userId,
                xp,
                level
            )
            VALUES
            (
                ?, 0, 1
            )
        `).run(userId);

    },

    update(userId, xp, level) {

        this.create(userId);

        db.prepare(`
            UPDATE users
            SET
                xp = ?,
                level = ?
            WHERE userId = ?
        `).run(
            xp,
            level,
            userId
        );

    },

    addXP(userId, xp) {

        this.create(userId);

        db.prepare(`
            UPDATE users
            SET xp = xp + ?
            WHERE userId = ?
        `).run(
            xp,
            userId
        );

    },

    setLevel(userId, level) {

        this.create(userId);

        db.prepare(`
            UPDATE users
            SET level = ?
            WHERE userId = ?
        `).run(
            level,
            userId
        );

    },

    getLeaderboard() {

        return db.prepare(`
            SELECT *
            FROM users
            ORDER BY
                level DESC,
                xp DESC
        `).all();

    }

};
