const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { panelRow } = require('../../utils/ticketManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('(Staff) Post the ticket-opening panel in this channel')
    .addStringOption((o) => o.setName('title').setDescription('Panel title'))
    .addStringOption((o) => o.setName('description').setDescription('Panel description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const title = interaction.options.getString('title') || '🎫 Need help?';
    const description =
      interaction.options.getString('description') ||
      'Click the button below to open a private ticket. Our AI assistant will jump in right away, and staff can take over anytime.';

    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x5865f2);

    await interaction.channel.send({ embeds: [embed], components: [panelRow()] });
    await interaction.reply({ content: '✅ Ticket panel posted.', ephemeral: true });
  },
};
