const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, MessageFlags } = require('discord.js');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Tạo phiếu hỗ trợ hoặc tố cáo')
        .addSubcommand(sub =>
            sub.setName('support')
                .setDescription('Gửi Bảng Support Ticket'))
        .addSubcommand(sub =>
            sub.setName('report')
                .setDescription('Gửi Bảng Report Ticket'))
        .addSubcommand(sub =>
            sub.setName('script-supported')
                .setDescription('Gửi Script (kèm ticket hỗ trợ)')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'script-supported') {
            if (!hasScriptPermission(interaction)) {
                return interaction.reply({
                    content: '🔒 Bạn không có quyền sử dụng lệnh này.',
                    flags: MessageFlags.Ephemeral
                });
            }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: 'LPT_HUB',
                iconURL: "https://res.cloudinary.com/dkui88bcf/image/upload/v1786939501/Logo_LPT_vnq390.png"
            })
            .setTitle('Script do mình tự làm')
            .setDescription(
                `Nếu bạn gặp lỗi với script, vui lòng tạo ticket tại <#1515926856589775100>\n\n` +
                `## Script\n\`\`\`lua\nloadstring(game:HttpGet("https://raw.githubusercontent.com/lyphucthien/LPT-Hub/refs/heads/main/LPT_Hub.luau"))()\`\`\`\n\n` +
                `Nhấn Nút Bên Dưới Để Xem Danh Sách Script Hỗ Trợ.`
            );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('script_games_supported')
                        .setLabel('Game Supported')
                        .setEmoji('🎮')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('script_executors_supported')
                        .setLabel('Executors Supported')
                        .setEmoji('⚙️')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ embeds: [embed], components: [row] });

            const msg = await interaction.fetchReply();

            const collector = msg.createMessageComponentCollector({
                time: 300000
            });

            collector.on('collect', async i => {
                if (i.customId === 'script_games_supported') {
                    return i.reply({
                        content:
                            '🎮 **Games Supported**\n\n' +
                            '**TRẠNG THÁI / STATUS**\n' +
                            '🟢 Đang Hoạt Động - ON\n' +
                            '🟡 Đang Cập Nhật - UPDATING\n' +
                            '🔴 Tạm Ngưng Hoạt Động - OFF\n\n' +
                            '**Game Status:**\n' +
                            '🔴 Blox Fruits *(Đang Làm)*\n' +
                            '🟢 +1 Speed Keyboard Escape\n' +
                            '🟢 Greedy Growers\n\n' +
                            '_Các game không được đề cập sẽ có 1 script hỗ trợ riêng.\n' +
                            'Games not mentioned will have a separate support script._',
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (i.customId === 'script_executors_supported') {
                    return i.reply({
                        content: '⚙️ **Executors Supported**\n\n_(nội dung sẽ cập nhật sau)_',
                        flags: MessageFlags.Ephemeral
                    });
                }
            });

            return;
        }

        if (sub === 'support') {
            const embed = new EmbedBuilder()
                .setTitle('🛠️ Tạo Phiếu Hỗ Trợ')
                .setDescription(
                    'Nhấn nút bên dưới để tạo ticket hỗ trợ.\n\n' +
                    `• Hỗ Trợ Kỹ Thuật\n` +
                    `• Lỗi Bot / Hệ Thống\n` +
                    `• Các Vấn Đề Khác\n\n` +
                    `⏱ Staff sẽ phản hồi sớm nhất có thể.`
                )
                .setColor('Blue');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_support')
                        .setLabel('SUPPORT')
                        .setEmoji('🛠️')
                        .setStyle(ButtonStyle.Primary)
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        }

        if (sub === 'report') {
            const embed = new EmbedBuilder()
                .setTitle('🚨 Tạo Phiếu Tố Cáo')
                .setDescription(
                    'Nhấn nút bên dưới để tạo ticket báo cáo.\n\n' +
                    `• Báo Cáo Người Chơi\n` +
                    `• Spam / Scam\n` +
                    `• Link Độc Hại\n` +
                    `• Vi Phạm Quy Định\n\n` +
                    `⏱ Staff sẽ kiểm tra và xử lý.`
                )
                .setColor('Red');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_report')
                        .setLabel('Báo Cáo')
                        .setEmoji('🚨')
                        .setStyle(ButtonStyle.Danger)
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};
