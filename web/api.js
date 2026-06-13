module.exports = (app, client) => {

    function getUptime() {
        const t = Math.floor(process.uptime());
        return {
            days: Math.floor(t / 86400),
            hours: Math.floor((t % 86400) / 3600),
            minutes: Math.floor((t % 3600) / 60)
        };
    }

    app.get("/status", (req, res) => {
        res.json({
            online: client.isReady(),
            bot: client.user?.tag || "Starting...",
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            ping: client.ws?.ping || null,
            ram: Math.round(process.memoryUsage().rss / 1024 / 1024),
            uptime: getUptime(),
            time: new Date().toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh"
            })
        });
    });

    // dùng cho chart realtime sau này
    app.get("/metrics", (req, res) => {
        res.json({
            ping: client.ws?.ping || 0,
            ram: process.memoryUsage().rss / 1024 / 1024,
            uptime: process.uptime()
        });
    });
};