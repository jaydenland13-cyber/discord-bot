const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarn, getWarns, clearWarns } = require('../../utils/warnsStorage');
const { logToModChannel } = require('../../utils/modLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn management')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Warn a member')
        .addUserOption((o) => o.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription("List a member's warnings")
        .addUserOption((o) => o.setName('user').setDescription('User to check').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription("Clear a member's warnings")
        .addUserOption((o) => o.setName('user').setDescription('User to clear').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');

    if (sub === 'add') {
      const reason = interaction.options.getString('reason');
      const count = addWarn(interaction.guild.id, target.id, reason, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Member Warned')
        .setColor(0xfee75c)
        .addFields(
          { name: 'User', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${interaction.user.tag}` },
          { name: 'Reason', value: reason },
          { name: 'Total Warnings', value: `${count}` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      target.send({ content: `You were warned in **${interaction.guild.name}**: ${reason}` }).catch(() => {});

      logToModChannel(interaction.guild, {
        title: '⚠️ Warn',
        color: 0xfee75c,
        fields: [
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Total Warnings', value: `${count}`, inline: true },
        ],
      });
    } else if (sub === 'list') {
      const warns = getWarns(interaction.guild.id, target.id);
      if (warns.length === 0) {
        return interaction.reply({ content: `${target.tag} has no warnings.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`⚠️ Warnings for ${target.tag}`)
        .setColor(0xfee75c)
        .setDescription(
          warns
            .map(
              (w, i) =>
                `**${i + 1}.** ${w.reason}\n— by <@${w.moderatorId}> on <t:${Math.floor(w.timestamp / 1000)}:d>`
            )
            .join('\n\n')
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === 'clear') {
      const count = clearWarns(interaction.guild.id, target.id);
      await interaction.reply({ content: `✅ Cleared ${count} warning(s) for ${target.tag}.` });
    }
  },
};
