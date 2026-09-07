const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logToModChannel } = require('../../utils/modLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((o) => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: '❌ That user is not in this server.', ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ content: "❌ I can't kick that user (role hierarchy or missing permissions).", ephemeral: true });
    }

    try {
      await member.kick(`${reason} | by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setTitle('👢 Member Kicked')
        .setColor(0xf5a623)
        .addFields(
          { name: 'User', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      logToModChannel(interaction.guild, {
        title: '👢 Kick',
        color: 0xf5a623,
        fields: [
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
        ],
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to kick that user.', ephemeral: true });
    }
  },
};
