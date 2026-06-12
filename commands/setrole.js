const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setrole')
        .setDescription('Quản Lý Role Thành Viên')

        .addSubcommand(sub =>
            sub
                .setName('add')
                .setDescription('Thêm Role Cho Thành Viên')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Thành viên')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('remove')
                .setDescription('Gỡ Role Của Thành viên')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Thành Viên')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName('toggle')
                .setDescription('Bật/Tắt Role')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Thành Viên')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role')
                        .setRequired(true)
                )
        )

        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');

        const member = await interaction.guild.members.fetch(user.id);

        // Kiểm tra role bot
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ Role Này Cao Hơn Hoặc Bằng Role Cao Nhất Của Bot',
                flags: 64
            });
        }

        // Kiểm tra role người dùng thực hiện
        if (
            role.position >= interaction.member.roles.highest.position &&
            interaction.guild.ownerId !== interaction.user.id
        ) {
            return interaction.reply({
                content: '❌ Bạn Không Thể Quản Lý Role Cao Hơn Hoặc Bằng Role Của Mình',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#8a82fd')
            .setTimestamp();

        try {

            if (sub === 'add') {

                if (member.roles.cache.has(role.id)) {
                    return interaction.reply({
                        content: '❌ Thành Viên Đã Có Role Này.',
                        flags: 64
                    });
                }

                await member.roles.add(role);

                embed
                    .setTitle('✅ Đã Thêm Role')
                    .setDescription(
                        `👤 Thành viên: ${member}\n` +
                        `🎭 Role: ${role}\n` +
                        `🛠️ Người Thực Hiện: ${interaction.user}`
                    );
            }

            else if (sub === 'remove') {

                if (!member.roles.cache.has(role.id)) {
                    return interaction.reply({
                        content: '❌ Thành Viên Không Có Role Này.',
                        flags: 64
                    });
                }

                await member.roles.remove(role);

                embed
                    .setTitle('🗑️ Đã Gỡ Role')
                    .setDescription(
                        `👤 Thành viên: ${member}\n` +
                        `🎭 Role: ${role}\n` +
                        `🛠️ Thực hiện: ${interaction.user}`
                    );
            }

            else if (sub === 'toggle') {

                if (member.roles.cache.has(role.id)) {

                    await member.roles.remove(role);

                    embed
                        .setTitle('❌ Role Đã Tắt')
                        .setDescription(
                            `👤 Thành viên: ${member}\n` +
                            `🎭 Role: ${role}`
                        );

                } else {

                    await member.roles.add(role);

                    embed
                        .setTitle('✅ Role Đã Bật')
                        .setDescription(
                            `👤 Thành viên: ${member}\n` +
                            `🎭 Role: ${role}`
                        );
                }
            }

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(error);

            await interaction.reply({
                content: '❌ Có Lỗi Xảy Ra Khi Quản Lý Role.',
                flags: 64
            });
        }
    }
};