const {SlashCommandBuilder,ContainerBuilder,TextDisplayBuilder,ActionRowBuilder,ModalBuilder,
    TextInputBuilder,TextInputStyle,SeparatorSpacingSize,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

const UPDATE_CHANNEL_ID = '1540328462840111225';
const UPDATE_ROLE_ID = '1544167526454403082';
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
            .setLabel('Status (chỉ nhập icon: 🟢 🟡 🟠 🔴 ⚫)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('...')
            .setRequired(true);

        const changelogInput = new TextInputBuilder()
            .setCustomId('input_changelog')
            .setLabel('Nhật ký thay đổi (mỗi dòng bắt đầu +/=/-)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('=Fixed lỗi X\n+Thêm tính năng Y\n-Gỡ bỏ Z')
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

        const channel = await submitted.client.channels.fetch(UPDATE_CHANNEL_ID).catch(() => null);

        if (!channel) {
            return submitted.reply({
                content: '❌ Không tìm thấy kênh thông báo. Kiểm tra lại UPDATE_CHANNEL_ID.',
                flags: MessageFlags.Ephemeral
            });
        }

        const lastStatus = getLastStatus();
        const statusLine = lastStatus
            ? `**Status:** ${lastStatus} → ${newStatus}`
            : `**Status:** ${newStatus}`;

        const changelogItems = buildChangelogAnsi(changelogRaw);

        const pingText = new TextDisplayBuilder().setContent(`<@&${UPDATE_ROLE_ID}>`);

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

        await channel.send({
            components: [pingText, container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { roles: [UPDATE_ROLE_ID] }
        });

        saveLastStatus(newStatus);

        return submitted.reply({
            content: `✅ Đã gửi thông báo update tới <#${UPDATE_CHANNEL_ID}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
