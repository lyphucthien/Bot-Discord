const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const config = require('../../config.json');
const ticketStatus = require('../../utils/ticketStatus');

const helperRoles = config.Helper ? [config.Helper] : [];

module.exports = async (interaction) => {

    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'ticket_menu') return;

    const type = interaction.values[0];

    const existing = interaction.guild.channels.cache.find(
        c => c.name.includes(interaction.user.id)
    );

    if (existing) {
        return interaction.reply({
            content: '❌ Bạn đã có ticket',
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    const channel = await interaction.guild.channels.create({
        name: `LamDong-${type}-${interaction.user.id}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
            },
            ...helperRoles.map(r => ({
                id: r,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
            }))
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle(`🎫 ${type.toUpperCase()} Ticket`)
        .setDescription(`Staff sẽ hỗ trợ bạn sớm nhất.`)
        .setColor('Blue');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Đóng Ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
    );

    const msg = await channel.send({
        content: `🚨 <@&${config.Helper} Có Ticket Mới Được Tạo!>`,
        embeds: [embed],
        components: [row]
    });

    ticketStatus.set(channel.id, {
        status: 'waiting',
        messageId: msg.id
    });

    return interaction.editReply({
        content: `✅ Đã tạo ticket: ${channel}`
    });

};