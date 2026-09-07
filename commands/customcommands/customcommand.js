const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCommand, removeCommand, listCommands } = require('../../utils/customCommandsStorage');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customcommand')
    .setDescription('Manage custom text commands')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription(`Add a custom command (trigger with your prefix, "${'!'}" by default)`)
        .addStringOption((o) => o.setName('trigger').setDescription('Word that triggers the response (no prefix)').setRequired(true))
        .addStringOption((o) => o.setName('response').setDescription('What the bot replies with').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a custom command')
        .addStringOption((o) => o.setName('trigger').setDescription('Trigger word to remove').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all custom commands'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const trigger = interaction.options.getString('trigger').toLowerCase().replace(/\s+/g, '');
      const response = interaction.options.getString('response');
      addCommand(interaction.guild.id, trigger, response);
      await interaction.reply({
        content: `✅ Added custom command: \`${config.customCommandPrefix}${trigger}\` → ${response.slice(0, 100)}`,
        ephemeral: true,
      });
    } else if (sub === 'remove') {
      const trigger = interaction.options.getString('trigger').toLowerCase();
      const removed = removeCommand(interaction.guild.id, trigger);
      await interaction.reply({
        content: removed ? `✅ Removed \`${trigger}\`.` : `❌ No command called \`${trigger}\` was found.`,
        ephemeral: true,
      });
    } else if (sub === 'list') {
      const triggers = listCommands(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setTitle('📋 Custom Commands')
        .setColor(0x5865f2)
        .setDescription(
          triggers.length ? triggers.map((t) => `\`${config.customCommandPrefix}${t}\``).join(', ') : 'No custom commands yet.'
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
