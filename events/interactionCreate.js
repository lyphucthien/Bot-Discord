const config = require('../config.json');

module.exports = (client) => {

    client.on('interactionCreate', async interaction => {

        try {

            if (interaction.isChatInputCommand()) {

                const command = client.commands.get(
                    interaction.commandName
                );

                if (!command) return;

                await command.execute(interaction);

            }

            // ======================
            // VERIFY BUTTON
            // ======================

            if (interaction.isButton()) {

                if (
                    interaction.customId ===
                    'verify'
                ) {

                    const role =
                        interaction.guild.roles.cache.get(
                            config.verifyRole
                        );

                    if (!role) {

                        return interaction.reply({
                            content:
                                '❌ Không tìm thấy role',
                            ephemeral: true
                        });

                    }

                    await interaction.member.roles.add(
                        role
                    );

                    await interaction.reply({
                        content:
                            '✅ Xác minh thành công',
                        ephemeral: true
                    });

                }

            }

        } catch (err) {

            console.error(err);

            if (
                interaction.deferred ||
                interaction.replied
            ) {

                await interaction.followUp({
                    content:
                        '❌ Đã xảy ra lỗi.',
                    ephemeral: true
                });

            } else {

                await interaction.reply({
                    content:
                        '❌ Đã xảy ra lỗi.',
                    ephemeral: true
                });

            }

        }

    });

};