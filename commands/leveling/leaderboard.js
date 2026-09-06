const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../utils/xpStorage');

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Show the top members by level/XP'),

  async execute(interaction) {
    const top = getLeaderboard(interaction.guild.id, 10);

    if (top.length === 0) {
      return interaction.reply({ content: 'No XP has been earned in this server yet.', ephemeral: true });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map((entry, i) => `${medals[i] || `**${i + 1}.**`} <@${entry.userId}> — Level ${entry.level} (${entry.xp} XP)`);

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
      .setDescription(lines.join('\n'))
      .setColor(0xf5a623);

    await interaction.reply({ embeds: [embed] });
  },
};
