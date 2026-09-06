const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { logToModChannel } = require('../../utils/modLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock or unlock this channel for @everyone')
    .addSubcommand((sub) => sub.setName('lock').setDescription('Prevent @everyone from sending messages here'))
    .addSubcommand((sub) => sub.setName('unlock').setDescription('Restore @everyone send permissions here'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const everyone = interaction.guild.roles.everyone;

    try {
      if (sub === 'lock') {
        await interaction.channel.permissionOverwrites.edit(everyone, {
          SendMessages: false,
        });
        await interaction.reply({ content: '🔒 This channel is now locked for @everyone.' });
      } else {
        await interaction.channel.permissionOverwrites.edit(everyone, {
          SendMessages: null, // reset to default/inherited rather than force-true
        });
        await interaction.reply({ content: '🔓 This channel has been unlocked.' });
      }

      logToModChannel(interaction.guild, {
        title: sub === 'lock' ? '🔒 Channel Locked' : '🔓 Channel Unlocked',
        color: sub === 'lock' ? 0xed4245 : 0x57f287,
        fields: [
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        ],
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to update channel permissions.', ephemeral: true });
    }
  },
};
