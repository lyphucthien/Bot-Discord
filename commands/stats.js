const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Thông Số Server (Thành Viên, Bot, Người Dùng Online, Idle, DND, Offline)'),

    async execute(interaction) {
        const guild = interaction.guild;

        await guild.members.fetch();

        const members = guild.members.cache;
        const total = guild.memberCount;

        const bots = members.filter(m => m.user.bot).size;
        const humans = total - bots;

        const online = members.filter(m => m.presence?.status === 'online').size;
        const idle = members.filter(m => m.presence?.status === 'idle').size;
        const dnd = members.filter(m => m.presence?.status === 'dnd').size;
        const offline = total - online - idle - dnd;

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`📊 ${guild.name} Stats`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👥 Total Members', value: `${total}`, inline: true },
                { name: '🧑 Humans', value: `${humans}`, inline: true },
                { name: '🤖 Bots', value: `${bots}`, inline: true },

                { name: '🟢 Online', value: `${online}`, inline: true },
                { name: '🌙 Idle', value: `${idle}`, inline: true },
                { name: '⛔ DND', value: `${dnd}`, inline: true },
                { name: '⚫ Offline', value: `${offline}`, inline: true },
            )
            .setFooter({ text: 'Hãy Nhấp Vào Các Nút Bên Dưới Để Xem Chi Tiết' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('online_list')
                .setLabel('🟢 Online Members')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('all_list')
                .setLabel('👥 All Members')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('bot_list')
                .setLabel('🤖 Bots')
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
