const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logToModChannel } = require('../../utils/modLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Give a member a role')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a member')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: '❌ That user is not in this server.', ephemeral: true });
    }

    const myTopRole = interaction.guild.members.me.roles.highest;
    if (role.position >= myTopRole.position) {
      return interaction.reply({
        content: "❌ I can't manage that role — it's above (or equal to) my highest role. Move my bot role above it in Server Settings → Roles.",
        ephemeral: true,
      });
    }

    try {
      if (sub === 'add') {
        await member.roles.add(role);
        await interaction.reply({ content: `✅ Added ${role} to ${target}.` });
      } else {
        await member.roles.remove(role);
        await interaction.reply({ content: `✅ Removed ${role} from ${target}.` });
      }

      logToModChannel(interaction.guild, {
        title: sub === 'add' ? '➕ Role Added' : '➖ Role Removed',
        color: 0x5865f2,
        fields: [
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Role', value: `${role}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        ],
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to update that role.', ephemeral: true });
    }
  },
};
