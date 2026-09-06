const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for this channel')
    .addIntegerOption((o) =>
      o
        .setName('seconds')
        .setDescription('Seconds between messages per user (0 to disable, max 21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      await interaction.reply({
        content: seconds === 0 ? '✅ Slowmode disabled for this channel.' : `✅ Slowmode set to ${seconds} second(s).`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to set slowmode.', ephemeral: true });
    }
  },
};
