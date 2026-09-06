const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logToModChannel } = require('../../utils/modLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a duration')
    .addUserOption((o) => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addIntegerOption((o) =>
      o.setName('minutes').setDescription('Duration in minutes (max 40320 = 28 days)').setRequired(true).setMinValue(1).setMaxValue(40320)
    )
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: '❌ That user is not in this server.', ephemeral: true });
    }
    if (!member.moderatable) {
      return interaction.reply({ content: "❌ I can't timeout that user (role hierarchy or missing permissions).", ephemeral: true });
    }

    try {
      await member.timeout(minutes * 60 * 1000, `${reason} | by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setTitle('⏳ Member Timed Out')
        .setColor(0xf5a623)
        .addFields(
          { name: 'User', value: `${target.tag} (${target.id})` },
          { name: 'Duration', value: `${minutes} minute(s)` },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      logToModChannel(interaction.guild, {
        title: '⏳ Timeout',
        color: 0xf5a623,
        fields: [
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Duration', value: `${minutes} minute(s)`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
        ],
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to timeout that user.', ephemeral: true });
    }
  },
};
