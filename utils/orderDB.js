const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../database/orders.json');

function read() {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return [];
    }
}

function write(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

function add(order) {
    const data = read();

    data.push(order);

    write(data);
}

function getUser(userId) {
    return read().filter(
        order => order.userId === userId
    );
}

module.exports = {
    add,
    getUser,
    read
};