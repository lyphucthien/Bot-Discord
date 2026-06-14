const Database = require('better-sqlite3');

const db = new Database('./database.db');

db.pragma('journal_mode = WAL');

// USERS
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
)
`).run();

// TICKETS
db.prepare(`
CREATE TABLE IF NOT EXISTS tickets (
    channelId TEXT PRIMARY KEY,
    status TEXT,
    staffReplied INTEGER DEFAULT 0,
    createdAt INTEGER,
    messageId TEXT
)
`).run();

// WARNS
db.prepare(`
CREATE TABLE IF NOT EXISTS warns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    moderatorId TEXT NOT NULL,
    reason TEXT,
    createdAt INTEGER
)
`).run();

module.exports = db;