const {SlashCommandBuilder,ActionRowBuilder,ModalBuilder,
    TextInputBuilder,TextInputStyle,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

const STATUS_FILE = path.join(__dirname, '..', 'lastStatus.json');
const UPDATE_IMAGE_URL = "https://res.cloudinary.com/dkui88bcf/image/upload/v1789189709/Update_clxugu.png";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1548194662282559493/x_DbKI2-uhP4IXaLpxsFdJTYJEasd0QpQM60t6S3qGq6Lyh41Ex569TzcH5asEJc8G6V";

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
            .setLabel('Nhật ký thay đổi (mỗi dòng +/-/space)')
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

        const payload = {
            flags: 32768, // IS_COMPONENTS_V2
            components: [
                {
                    type: 10,
                    content: '@everyone'
                },
                {
                    type: 12,
                    items: [
                        { media: { url: UPDATE_IMAGE_URL } }
                    ]
                },
                {
                    type: 17,
                    accent_color: 0x2ecc71,
                    components: [
                        {
                            type: 10,
                            content: `### 🟢 ${version}\nRestart Script Để Áp Dụng Bản Cập Nhật, hoặc sao chép script ở kênh <#${"1540328462840111225"}>.`
                        },
                        { type: 14, spacing: 1 }, // Separator
                        {
                            type: 10,
                            content: `**Nhật Ký Thay Đổi:**\n\`\`\`diff\n${changelogDiff}\n\`\`\``
                        },
                        { type: 14, spacing: 1 },
                        {
                            type: 10,
                            content: `**Updated:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ],
            allowed_mentions: { parse: ['everyone'] }
        };

        try {
            const res = await fetch(`${WEBHOOK_URL}?wait=true&with_components=true`, {
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

        saveLastStatus(version);

        return submitted.reply({
            content: `✅ Đã gửi thông báo update tới <#${"1540328462840111225"}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
