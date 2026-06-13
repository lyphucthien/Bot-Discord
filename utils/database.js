const fs = require('fs');
const path = require('path');

function readDB(fileName) {
    const filePath = path.join(__dirname, '../database/models', fileName);

    try {
        if (!fs.existsSync(filePath)) return {};

        const data = fs.readFileSync(filePath, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (err) {
        console.error('Read DB error:', err);
        return {};
    }
}

function writeDB(fileName, data) {
    const filePath = path.join(__dirname, '../database/models', fileName);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Write DB error:', err);
    }
}

module.exports = { readDB, writeDB };