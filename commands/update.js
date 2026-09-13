const {SlashCommandBuilder,ActionRowBuilder,ModalBuilder,
    TextInputBuilder,TextInputStyle,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

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

function getNextVersion() {
    let lastVersion = "1.0.0";

    try {
        const data = fs.readFileSync(STATUS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (parsed.version) {
            const parts = parsed.version.split('.').map(Number);
            parts[2] += 1;
            return parts.join('.');
        }
    } catch {}

    return lastVersion;
}

function saveVersion(version) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ version }), 'utf8');
}

function buildChangelogDiff(changelogRaw) {
    return changelogRaw
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .join('\n');
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
            .setPlaceholder('chỉ nhập icon (🟢 🟡 🟠 🔴 ⚫)')
            .setRequired(true);

        const changelogInput = new TextInputBuilder()
            .setCustomId('input_changelog')
            .setLabel('Nhật ký thay đổi (mỗi dòng +/-/space)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('+ Thêm tính năng X\n- Gỡ bỏ Y\n  Mô tả thường')
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

        const status = submitted.fields.getTextInputValue('input_status');
        const changelogRaw = submitted.fields.getTextInputValue('input_changelog');
        const changelogDiff = buildChangelogDiff(changelogRaw);

        const newVersion = getNextVersion();

        const payload = {
            flags: 32768,
            components: [
                {
                    type: 17,
                    components: [
                        {
                            type: 10,
                            content: `@everyone`
                        },
                        {
                            type: 12,
                            items: [
                                { media: {url: "https://res.cloudinary.com/dkui88bcf/image/upload/v1789288743/Update_cmplig.png"} }
                            ]
                        },
                        {
                            type: 10,
                            content: `## Status:** ${status}\n## Version: \`v${newVersion}\`\n\nRestart Script Để Áp Dụng Bản Cập Nhật>`
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 10,
                            content: `**Changelog:**\n\`\`\`${changelogDiff}\`\`\``
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 10,
                            content: `**Updated** <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ],
            allowed_mentions: { parse: ['everyone'] }
        };

        try {
            const res = await fetch(`${"https://discord.com/api/webhooks/1548194662282559493/x_DbKI2-uhP4IXaLpxsFdJTYJEasd0QpQM60t6S3qGq6Lyh41Ex569TzcH5asEJc8G6V"}?wait=true&with_components=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                console.error('Webhook error:', errData);
                return submitted.reply({
                    content: '❌ Gửi webhook thất bại. Kiểm tra lại Webhook (Update).',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (err) {
            console.error('Fetch threw:', err);
            return submitted.reply({
                content: '❌ Lỗi khi gọi webhook.',
                flags: MessageFlags.Ephemeral
            });
        }

        saveVersion(newVersion);

        return submitted.reply({
            content: `✅ Đã gửi thông báo update v${newVersion} tới <#${"1540328462840111225"}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
