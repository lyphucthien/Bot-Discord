const state = require("../state");

module.exports = (client) => {

    client.on("messageCreate", async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        const prefix = ".";
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        // ======================
        // .maint COMMAND
        // ======================
        if (command === "maint") {

            // chỉ admin
            if (!message.member.permissions.has("Administrator")) {
                return message.reply("❌ Bạn Không Có Quyền Dùng Lệnh Này!");
            }

            const mode = args[0];

            if (!mode) {
                return message.reply("⚠️ Dùng: `.maint on` hoặc `.maint off`");
            }

            if (mode === "on") {
                state.maintenance = true;
                return message.reply("🔴 **Đã BẬT BẢO TRÌ!**");
            }

            if (mode === "off") {
                state.maintenance = false;
                return message.reply("🟢 **Đã TẮT BẢO TRÌ!**");
            }

            return message.reply("⚠️ Chỉ dùng: `on` hoặc `off`");
        }
    });

};
