const {SlashCommandBuilder,ActionRowBuilder,ModalBuilder,
    TextInputBuilder,TextInputStyle,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

const UPDATE_CHANNEL_ID = '1540328462840111225';
const STATUS_FILE = path.join(__dirname, '..', 'lastStatus.json');
const WORKING_EMOJI = "<:working:1544604345356787832>"; // đổi ID emoji custom của server bạn
const WEBHOOK_URL = "https://discord.com/api/webhooks/1548194662282559493/x_DbKI2-uhP4IXaLpxsFdJTYJEasd0QpQM60t6S3qGq6Lyh41Ex569TzcH5asEJc8G6V";
const UPDATE_IMAGE_URL = "https://res.cloudinary.com/dkui88bcf/image/upload/v1789189709/Update_clxugu.png";

function hasScriptPermission(interaction) {
    if (interaction.user.id === '1330395226933559297') return true;
    if (interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;

    const helperRole = config.Helper;
    return Boolean(
        helperRole &&
        interaction.member?.roles?.cache?.has(helperRole)
    );
}

function saveLastStatus(status) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status }), 'utf8');
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

        const versionInput = new TextInputBuilder()
            .setCustomId('input_version')
            .setLabel('Version')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('v2.5.4')
            .setRequired(true);

        const changelogInput = new TextInputBuilder()
            .setCustomId('input_changelog')
            .setLabel('Changelog (mỗi dòng bắt đầu +/-/space)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('+ Thêm tính năng X\n- Gỡ bỏ Y\n  Mô tả thường')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(versionInput),
            new ActionRowBuilder().addComponents(changelogInput)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 300000,
            filter: i => i.customId === 'update_modal' && i.user.id === interaction.user.id
        }).catch(() => null);

        if (!submitted) return;

        const version = submitted.fields.getTextInputValue('input_version');
        const changelogRaw = submitted.fields.getTextInputValue('input_changelog');
        const changelogDiff = buildChangelogDiff(changelogRaw);

        const messageContent =
`@everyone
## ${WORKING_EMOJI} ${version}
Restart Script Để Áp Dụng bản cập nhật, hoặc dùng nút download bên dưới.

**Changelog:**
\`\`\`diff
${changelogDiff}
\`\`\`
**Released:** <t:${Math.floor(Date.now() / 1000)}:F>`;

        try {
            const basePayload = {
                allowed_mentions: { parse: ['everyone'] }
            };

            // Tin 1
            const res1 = await fetch(`${WEBHOOK_URL}?wait=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...basePayload,
                    embeds: [{ image: { url: UPDATE_IMAGE_URL } }]
                })
            });

            if (!res1.ok) {
                const errData = await res1.json().catch(() => null);
                console.error('Webhook error (ảnh):', errData);
                return submitted.reply({
                    content: '❌ Gửi webhook thất bại. Kiểm tra lại Webhook (Update).',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Tin 2
            const res2 = await fetch(`${WEBHOOK_URL}?wait=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...basePayload,
                    content: messageContent
                })
            });

            if (!res2.ok) {
                const errData = await res2.json().catch(() => null);
                console.error('Webhook error (text):', errData);
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

        saveLastStatus(version);

        return submitted.reply({
            content: `✅ Đã gửi thông báo update tới <#${UPDATE_CHANNEL_ID}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
