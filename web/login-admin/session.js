const session = require("express-session");
const config = require("./config");

module.exports = (app) => {
    app.use(session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    }));
};