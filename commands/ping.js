const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const si = require("systeminformation");

function formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);

    return `${d}d ${h}h ${m}m`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Xem ping, RAM, CPU, uptime của bot"),

    async execute(interaction, client) {

        await interaction.deferReply();

        const apiPing = client.ws.ping;

        const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);

        const cpuLoad = await si.currentLoad();
        const cpu = Math.round(cpuLoad.currentLoad || 0);

        const uptime = formatUptime(process.uptime());

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📊 Thống Kê Hệ Thống")
            .addFields(
                { name: "⚡ Ping", value: `${apiPing} ms`, inline: true },
                { name: "💾 RAM", value: `${ram} MB`, inline: true },
                { name: "🖥 CPU", value: `${cpu}%`, inline: true },
                { name: "🕒 Uptime", value: uptime, inline: false }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
