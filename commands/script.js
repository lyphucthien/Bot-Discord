const {SlashCommandBuilder,EmbedBuilder,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');

const OWNER_ID = '1330395226933559297';

function hasScriptPermission(interaction) {
    if (interaction.user.id === OWNER_ID) return true;
    if (interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;

    const helperRole = config.Helper;
    return Boolean(
        helperRole &&
        interaction.member?.roles?.cache?.has(helperRole)
    );
}

const SCRIPT_EMBED = {
    title: 'Script do mình tự làm',
    authorName: 'LPT_HUB',
    authorIcon: "https://res.cloudinary.com/dkui88bcf/image/upload/v1786939501/Logo_LPT_vnq390.png",
    ticketChannelId: '1515926856589775100',
    ticketLine: 'Nếu bạn gặp lỗi với script, vui lòng tạo ticket tại {ticket}',
    scriptLabel: `\`\`\`lua\nloadstring(game:HttpGet("https://raw.githubusercontent.com/lyphucthien/LPT-Hub/refs/heads/main/LPT_Hub.luau"))()\`\`\``
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('script')
        .setDescription('Gửi Script'),

    async execute(interaction) {
        if (!hasScriptPermission(interaction)) {
            return interaction.reply({
                content: '🔒 Bạn không có quyền sử dụng lệnh này.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: SCRIPT_EMBED.authorName,
                iconURL: SCRIPT_EMBED.authorIcon
            })
            .setTitle(SCRIPT_EMBED.title)
            .setDescription(
                `${SCRIPT_EMBED.ticketLine.replace('{ticket}', `<#${SCRIPT_EMBED.ticketChannelId}>`)}\n\n` +
                `## Script\n${SCRIPT_EMBED.scriptLabel}`
            );

        return interaction.reply({ embeds: [embed] });
    }
};

module.exports.hasScriptPermission = hasScriptPermission;
