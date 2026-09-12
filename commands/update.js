const {SlashCommandBuilder,ContainerBuilder,TextDisplayBuilder,ActionRowBuilder,ModalBuilder,
    TextInputBuilder,TextInputStyle,SeparatorSpacingSize,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const { WebhookClient } = require('discord.js');

const UPDATE_CHANNEL_ID = '1540328462840111225';
const STATUS_FILE = path.join(__dirname, '..', 'lastStatus.json');

function hasScriptPermission(interaction) {
    if (interaction.user.id === '1330395226933559297') return true;
    if (interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;

    const helperRole = config.Helper;
    return Boolean(
        helperRole &&
        interaction.member?.roles?.cache?.has(helperRole)
    );
}

function getLastStatus() {
    try {
        const data = fs.readFileSync(STATUS_FILE, 'utf8');
        return JSON.parse(data).status || null;
    } catch {
        return null;
    }
}

function saveLastStatus(status) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status }), 'utf8');
}

function buildChangelogAnsi(changelogRaw) {
    const colorMap = {
        '+': '32',
        '=': '33',
        '-': '31'
    };

    const lines = changelogRaw
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => {
            const symbol = item[0];
            const text = item.slice(1).trim();
            const color = colorMap[symbol] || '37';

            return `\u001b[1;${color}m[${symbol}] ${text}\u001b[0m`;
        })
        .join('\n');

    return `\`\`\`ansi\n${lines}\n\`\`\``;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thongbao-update')
        .setDescription('Mở bảng nhập nội dung thông báo update'),

    async execute(interaction) {
        if (!hasScriptPermission(interaction)) {
            return interaction.reply({
                content: '🔒 Bạn không có quyền sử dụng lệnh này.',
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('update_modal')
            .setTitle('Thông Báo Update');

        const statusInput = new TextInputBuilder()
            .setCustomId('input_status')
            .setLabel('Status')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('chỉ nhập icon: 🟢 🟡 🟠 🔴 ⚫')
            .setRequired(true);

        const changelogInput = new TextInputBuilder()
            .setCustomId('input_changelog')
            .setLabel('Nhật ký thay đổi (mỗi dòng bắt đầu +/=/-)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('= Fixed lỗi X\n+ Thêm tính năng Y\n- Gỡ bỏ Z')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(statusInput),
            new ActionRowBuilder().addComponents(changelogInput)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 300000,
            filter: i => i.customId === 'update_modal' && i.user.id === interaction.user.id
        }).catch(() => null);

        if (!submitted) return;

        const newStatus = submitted.fields.getTextInputValue('input_status');
        const changelogRaw = submitted.fields.getTextInputValue('input_changelog');

        const lastStatus = getLastStatus();
        const statusLine = lastStatus
            ? `**Status:** ${lastStatus} → ${newStatus}`
            : `**Status:** ${newStatus}`;

        const changelogItems = buildChangelogAnsi(changelogRaw);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                td => td.setContent('# UPDATE')
            )
            .addTextDisplayComponents(
                td => td.setContent(statusLine)
            )
            .addSeparatorComponents(
                sep => sep.setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                td => td.setContent(`**Nhật ký thay đổi:**\n${changelogItems}`)
            )
            .addSeparatorComponents(
                sep => sep.setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                td => td.setContent(`**Updated:** <t:${Math.floor(Date.now() / 1000)}:F>`)
            );

        const pingText = new TextDisplayBuilder().setContent('@everyone');

        const webhookClient = new WebhookClient({url:"https://discord.com/api/webhooks/1548194662282559493/x_DbKI2-uhP4IXaLpxsFdJTYJEasd0QpQM60t6S3qGq6Lyh41Ex569TzcH5asEJc8G6V"});

        await webhookClient.send({
            components: [pingText, container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: ['everyone'] }
        }).catch(async (err) => {
            console.error(err);
            return submitted.reply({
                content: '❌ Gửi webhook thất bại. Kiểm tra lại Webhook (Update).',
                flags: MessageFlags.Ephemeral
            });
        });

        saveLastStatus(newStatus);

        return submitted.reply({
            content: `✅ Đã gửi thông báo update tới <#${UPDATE_CHANNEL_ID}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
