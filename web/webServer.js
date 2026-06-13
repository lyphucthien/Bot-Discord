const express = require("express");

module.exports = (client) => {
    const app = express();
    const PORT = process.env.PORT || 3000;

    require("./api")(app, client);
    require("./dashboard")(app, client);

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 Web Server chạy ở cổng ${PORT}`);
    });
};