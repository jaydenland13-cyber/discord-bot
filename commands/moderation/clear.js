const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete recent messages in this channel')
    .addIntegerOption((o) =>
      o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let toDelete = messages;

      if (user) {
        toDelete = messages.filter((m) => m.author.id === user.id).first(amount);
      } else {
        toDelete = messages.first(amount);
      }

      const deleted = await interaction.channel.bulkDelete(toDelete, true);
      await interaction.editReply({ content: `🧹 Deleted ${deleted.size} message(s).` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: '❌ Failed to delete messages (they may be older than 14 days, which Discord does not allow bulk-deleting).',
      });
    }
  },
};
