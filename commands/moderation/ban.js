const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logToModChannel } = require('../../utils/modLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption((o) => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((o) =>
      o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = interaction.guild.members.cache.get(target.id);
    if (member && !member.bannable) {
      return interaction.reply({ content: "❌ I can't ban that user (role hierarchy or missing permissions).", ephemeral: true });
    }

    try {
      await interaction.guild.members.ban(target.id, {
        deleteMessageSeconds: deleteDays * 86400,
        reason: `${reason} | by ${interaction.user.tag}`,
      });

      const embed = new EmbedBuilder()
        .setTitle('🔨 Member Banned')
        .setColor(0xed4245)
        .addFields(
          { name: 'User', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      logToModChannel(interaction.guild, {
        title: '🔨 Ban',
        color: 0xed4245,
        fields: [
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
        ],
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to ban that user.', ephemeral: true });
    }
  },
};
