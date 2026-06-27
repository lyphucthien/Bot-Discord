const config = require("./config");

function login(username, password) {
    return (
        username === config.admin.username &&
        password === config.admin.password
    );
}

module.exports = { login };