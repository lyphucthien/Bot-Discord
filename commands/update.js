const {SlashCommandBuilder,ActionRowBuilder,ModalBuilder,
    TextInputBuilder,TextInputStyle,PermissionsBitField,MessageFlags,
    ContainerBuilder,TextDisplayBuilder,SeparatorSpacingSize} = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

const UPDATE_CHANNEL_ID = '1540328462840111225';
const STATUS_FILE = path.join(__dirname, '..', 'lastStatus.json');
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

        const channel = await submitted.client.channels.fetch(UPDATE_CHANNEL_ID).catch(() => null);

        if (!channel) {
            return submitted.reply({
                content: '❌ Không tìm thấy kênh thông báo. Kiểm tra lại UPDATE_CHANNEL_ID.',
                flags: MessageFlags.Ephemeral
            });
        }

        const pingText = new TextDisplayBuilder().setContent('@everyone');

        const container = new ContainerBuilder()
            .setAccentColor(0x2ecc71)
            .addTextDisplayComponents(
                td => td.setContent('# UPDATE')
            )
            .addTextDisplayComponents(
                td => td.setContent(`### 🟢 ${version}\nRestart Script Để Áp Dụng Bản Cập Nhật, hoặc sao chép script ở kênh <#${1540316772245307433}>.`)
            )
            .addSeparatorComponents(
                sep => sep.setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                td => td.setContent(`**Nhật Ký Thay Đổi:**\n\`\`\`diff\n${changelogDiff}\n\`\`\``)
            )
            .addSeparatorComponents(
                sep => sep.setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                td => td.setContent(`**Updated:** <t:${Math.floor(Date.now() / 1000)}:F>`)
            );

        try {
            await channel.send({
                files: [UPDATE_IMAGE_URL]
            });

            await channel.send({
                components: [pingText, container],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: ['everyone'] }
            });
        } catch (err) {
            console.error('Gửi thất bại:', err);
            return submitted.reply({
                content: '❌ Gửi thông báo thất bại. Kiểm tra lại quyền bot hoặc log.',
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
