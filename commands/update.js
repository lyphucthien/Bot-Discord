const {SlashCommandBuilder,ContainerBuilder,TextDisplayBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ModalBuilder,
    TextInputBuilder,TextInputStyle,SeparatorSpacingSize,PermissionsBitField,MessageFlags} = require('discord.js');
const config = require('../config.json');

const UPDATE_CHANNEL_ID = '1540328462840111225';
const UPDATE_ROLE_ID = '1544167526454403082';

function hasScriptPermission(interaction) {
    if (interaction.user.id === '1330395226933559297') return true;
    if (interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;

    const helperRole = config.Helper;
    return Boolean(
        helperRole &&
        interaction.member?.roles?.cache?.has(helperRole)
    );
}

function formatVietnameseTime(date) {
    const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const period = hour >= 12 ? 'CH' : 'SA';
    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${weekday}, ${day} Tháng ${month}, ${year} ${hour}:${minute} ${period}`;
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

        const versionInput = new TextInputBuilder()
            .setCustomId('input_version')
            .setLabel('Version')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('VD: 1.0.1')
            .setRequired(true);

        const robloxVersionInput = new TextInputBuilder()
            .setCustomId('input_roblox_version')
            .setLabel('Roblox External Version')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('VD: version-17d504d2c9544583')
            .setRequired(true);

        const statusInput = new TextInputBuilder()
            .setCustomId('input_status')
            .setLabel('Status (chỉ nhập icon: 🟢 🟡 🟠 🔴 ⚫)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('🟢')
            .setRequired(true);

        const changelogInput = new TextInputBuilder()
            .setCustomId('input_changelog')
            .setLabel('Changelog (mỗi dòng bắt đầu +/=/-)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('=Fixed lỗi X\n+Thêm tính năng Y\n-Gỡ bỏ Z')
            .setRequired(true);

        const downloadInput = new TextInputBuilder()
            .setCustomId('input_download')
            .setLabel('Link Tải')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://...')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(versionInput),
            new ActionRowBuilder().addComponents(robloxVersionInput),
            new ActionRowBuilder().addComponents(statusInput),
            new ActionRowBuilder().addComponents(changelogInput),
            new ActionRowBuilder().addComponents(downloadInput)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 300000,
            filter: i => i.customId === 'update_modal' && i.user.id === interaction.user.id
        }).catch(() => null);

        if (!submitted) return;

        const version = submitted.fields.getTextInputValue('input_version');
        const robloxVersion = submitted.fields.getTextInputValue('input_roblox_version');
        const status = submitted.fields.getTextInputValue('input_status');
        const changelogRaw = submitted.fields.getTextInputValue('input_changelog');
        const downloadLink = submitted.fields.getTextInputValue('input_download');

        const channel = await submitted.client.channels.fetch(UPDATE_CHANNEL_ID).catch(() => null);

        if (!channel) {
            return submitted.reply({
                content: '❌ Không tìm thấy kênh thông báo. Kiểm tra lại UPDATE_CHANNEL_ID.',
                flags: MessageFlags.Ephemeral
            });
        }

        const changelogItems = buildChangelogAnsi(changelogRaw);
        const timeText = formatVietnameseTime(new Date());

        const pingText = new TextDisplayBuilder().setContent(`<@&${UPDATE_ROLE_ID}>`);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                td => td.setContent('# UPDATE')
            )
            .addTextDisplayComponents(
                td => td.setContent(
                    `**Status:** ${status}\n` +
                    `**Time:** ${timeText}\n` +
                    `**Version:** \`${version}\`\n` +
                    `**Roblox External Version:** \`${robloxVersion}\``
                )
            )
            .addSeparatorComponents(
                sep => sep.setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                td => td.setContent(`**Changelog:**\n${changelogItems}`)
            )
            .addSeparatorComponents(
                sep => sep.setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                td => td.setContent('Please restart Roblox External to apply the changes or download.')
            );

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Download')
                    .setStyle(ButtonStyle.Link)
                    .setURL(downloadLink)
            );

        await channel.send({
            components: [pingText, container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { roles: [UPDATE_ROLE_ID] }
        });

        return submitted.reply({
            content: `✅ Đã gửi thông báo update tới <#${UPDATE_CHANNEL_ID}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
