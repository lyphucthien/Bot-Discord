const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../config.json');

function hasScriptPermission(interaction) {
    if (interaction.user.id === '1330395226933559297') return true;
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
        .setDescription('Tạo Bảng Ticket')
        .addSubcommand(sub =>
            sub.setName('support')
                .setDescription('Gửi Bảng Ticket Support'))
        .addSubcommand(sub =>
            sub.setName('report')
                .setDescription('Gửi Bảng Ticket Report'))
        .addSubcommand(sub =>
            sub.setName('script')
                .setDescription('Gửi Script'))
        .addSubcommand(sub =>
            sub.setName('executor-supported')
                .setDescription('Gửi Executor Được Hỗ Trợ')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'script') {
            if (!hasScriptPermission(interaction)) {
                return interaction.reply({
                    content: '🔒 Bạn không có quyền sử dụng lệnh này.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#4b4b4b')
                .setAuthor({
                    name: 'LPT HUB',
                    iconURL: "https://res.cloudinary.com/dkui88bcf/image/upload/v1786939501/Logo_LPT_vnq390.png"
                })
                .setDescription(
                    `Nếu bạn gặp lỗi trong quá trình sử dụng, vui lòng gửi hỗ trợ tại <#1515926856589775100>\n` +
                    `## Script\n\`\`\`lua\nloadstring(game:HttpGet("https://raw.githubusercontent.com/lyphucthien/LPT-Hub/refs/heads/main/LPT_Hub.luau"))()\`\`\`\n` +
                    `Nhấn Nút Bên Dưới Để Xem Danh Sách Script Hỗ Trợ.`
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('script_game_supported')
                        .setLabel('Game Supported')
                        .setEmoji('🎮')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({ embeds: [embed], components: [row] });

            const msg = await interaction.fetchReply();

            const collector = msg.createMessageComponentCollector({
                time: 300000
            });

            collector.on('collect', async i => {
                if (i.customId === 'script_game_supported') {
                    return i.reply({
                        content:
                            '# 🎮 Game Supported\n\n' +
                            '## TRẠNG THÁI / STATUS\n' +
                            '> **🟢 Đang Hoạt Động - ON**\n' +
                            '> **🟡 Đang Cập Nhật - UPDATING**\n' +
                            '> **🔴 Tạm Ngưng Hoạt Động - OFF**\n\n' +
                            '## Game Status:\n' +
                            '> **🔴 Blox Fruits (Đang Phát Triển)**\n' +
                            '> **🟢 +1 Speed Keyboard Escape**\n' +
                            '> **🟢 Greedy Growers**\n\n' +
                            '**Các game không được đề cập sẽ có 1 script hỗ trợ riêng.\n' +
                            'Games not mentioned will have a separate support script.**',
                        flags: MessageFlags.Ephemeral
                    });
                }
            });
            return;
        }

        if (sub === 'executor-supported') {
            if (!hasScriptPermission(interaction)) {
                return interaction.reply({
                    content: '🔒 Bạn không có quyền sử dụng lệnh này.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#272727')
                .setAuthor({
                    name: 'LPT HUB',
                    iconURL: "https://res.cloudinary.com/dkui88bcf/image/upload/v1786939501/Logo_LPT_vnq390.png"
                })
                .setDescription(
                    `# Executor Supported\n` +
                    `## TRẠNG THÁI / STATUS\n` +
                    `> **🟢 Đã Cập Nhật - Updated**\n` +
                    `> **🟡 Không Ổn Định - Unstable**\n` +
                    `> **🟠 Chưa Cập Nhật - Not Update Yet**\n` +
                    `> **🔴 Đang Bảo Trì - Under Maintenance:**\n` +
                    `> **⚫ Tạm Ngưng Hoạt Động - OFF**\n` +
                    `**Chọn nền tảng của bạn để xem danh sách executor tương thích.**`
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('executor_pc')
                        .setLabel('PC / Laptop')
                        .setEmoji('💻')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('executor_mac')
                        .setLabel('Macbook')
                        .setEmoji('🍎')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('executor_mobile')
                        .setLabel('Mobile')
                        .setEmoji('📱')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({ embeds: [embed], components: [row] });

            const msg = await interaction.fetchReply();

            const collector = msg.createMessageComponentCollector({time: 300000});

            collector.on('collect', async i => {
                if (i.customId === 'executor_pc') {
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId('select_executor_pc')
                        .setPlaceholder('Chọn 1 executor để xem thông tin')
                        .addOptions([
                            { label: 'Wave', value: 'Wave' },
                            { label: 'Volt', value: 'Volt' },
                            { label: 'Potassium', value: 'Potassium' },
                            { label: 'Volcano', value: 'Volcano' },
                            { label: 'Seliware', value: 'Seliware' },
                            { label: 'Ronix', value: 'Ronix' },
                            { label: 'Velocity', value: 'Velocity' },
                            { label: 'Madium', value: 'Madium' },
                            { label: 'YUB-X', value: 'YUB-X' }
                        ]);

                    const selectRow = new ActionRowBuilder().addComponents(menu);

                    return i.reply({
                        content: '💻 **Executor PC / Laptop — Select (1/1) 1-9**',
                        components: [selectRow],
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (i.customId === 'executor_mac') {
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId('select_executor_mac')
                        .setPlaceholder('Chọn 1 executor để xem thông tin')
                        .addOptions([
                            { label: 'Hydrogen', value: 'Hydrogen' },
                            { label: 'Macsploit', value: 'Macsploit' }
                        ]);

                    const selectRow = new ActionRowBuilder().addComponents(menu);

                    return i.reply({
                        content: '🍎 **Macbook — Select (1/1) 1-2**',
                        components: [selectRow],
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (i.customId === 'executor_mobile') {
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId('select_executor_mobile')
                        .setPlaceholder('Chọn 1 executor để xem thông tin')
                        .addOptions([
                            { label: 'Arceus X', value: 'Arceus X' },
                            { label: 'Delta', value: 'Delta' },
                            { label: 'Codex', value: 'Codex' }
                        ]);

                    const selectRow = new ActionRowBuilder().addComponents(menu);

                    return i.reply({
                        content: '📱 **Mobile — Select (1/1) 1-3**',
                        components: [selectRow],
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (i.isStringSelectMenu()) {
                    const chosen = i.values[0];
                    return i.reply({
                        content: `**${chosen}**\n\n_(thông tin chi tiết sẽ cập nhật sau)_`,
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
