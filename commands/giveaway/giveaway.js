const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGiveaway, endGiveaway, getGiveaway, resetForReroll } = require('../../utils/giveawayManager');

function parseDuration(input) {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(input.trim());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption((o) => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addStringOption((o) =>
          o.setName('duration').setDescription('How long it runs, e.g. 30s, 10m, 2h, 1d').setRequired(true)
        )
        .addIntegerOption((o) =>
          o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20)
        )
        .addBooleanOption((o) =>
          o.setName('require_server_tag').setDescription("Only allow entries from users with this server's tag equipped")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('end')
        .setDescription('End a giveaway early')
        .addStringOption((o) => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('reroll')
        .setDescription('Pick new winner(s) for an ended giveaway')
        .addStringOption((o) => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationStr = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners');
      const requireTag = interaction.options.getBoolean('require_server_tag') || false;

      const durationMs = parseDuration(durationStr);
      if (!durationMs || durationMs < 5000) {
        return interaction.reply({
          content: '❌ Invalid duration. Use a format like `30s`, `10m`, `2h`, or `1d` (minimum 5 seconds).',
          ephemeral: true,
        });
      }

      await interaction.reply({ content: '✅ Giveaway started!', ephemeral: true });
      await createGiveaway(interaction, { prize, durationMs, winnerCount: winners, requireTag });
      return;
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = getGiveaway(messageId);
      if (!giveaway || giveaway.guildId !== interaction.guild.id) {
        return interaction.reply({ content: '❌ No giveaway found with that message ID.', ephemeral: true });
      }
      if (giveaway.ended) {
        return interaction.reply({ content: '⚠️ That giveaway has already ended.', ephemeral: true });
      }

      await interaction.reply({ content: '✅ Ending the giveaway now...', ephemeral: true });
      await endGiveaway(interaction.client, messageId);
      return;
    }

    if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = getGiveaway(messageId);
      if (!giveaway || giveaway.guildId !== interaction.guild.id) {
        return interaction.reply({ content: '❌ No giveaway found with that message ID.', ephemeral: true });
      }
      if (!giveaway.ended) {
        return interaction.reply({ content: '⚠️ That giveaway is still running — use `/giveaway end` first.', ephemeral: true });
      }

      await interaction.reply({ content: '🔁 Rerolling winner(s)...', ephemeral: true });
      resetForReroll(messageId);
      await endGiveaway(interaction.client, messageId, { isReroll: true });
      return;
    }
  },
};
