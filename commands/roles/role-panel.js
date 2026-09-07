const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-panel')
    .setDescription('(Staff) Post a self-assign role button panel')
    .addStringOption((o) => o.setName('title').setDescription('Panel title').setRequired(true))
    .addRoleOption((o) => o.setName('role1').setDescription('Role #1').setRequired(true))
    .addRoleOption((o) => o.setName('role2').setDescription('Role #2'))
    .addRoleOption((o) => o.setName('role3').setDescription('Role #3'))
    .addRoleOption((o) => o.setName('role4').setDescription('Role #4'))
    .addRoleOption((o) => o.setName('role5').setDescription('Role #5'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const roles = [1, 2, 3, 4, 5]
      .map((i) => interaction.options.getRole(`role${i}`))
      .filter(Boolean);

    const myTopRole = interaction.guild.members.me.roles.highest;
    const tooHigh = roles.find((r) => r.position >= myTopRole.position);
    if (tooHigh) {
      return interaction.reply({
        content: `❌ I can't manage ${tooHigh} — it's above (or equal to) my highest role. Move my bot role above it first.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription('Click a button below to add or remove that role from yourself.')
      .setColor(0x5865f2);

    const row = new ActionRowBuilder().addComponents(
      roles.map((r) =>
        new ButtonBuilder().setCustomId(`rolepanel:${r.id}`).setLabel(r.name).setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Role panel posted.', ephemeral: true });
  },
};
