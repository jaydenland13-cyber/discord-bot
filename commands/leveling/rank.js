const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, xpForLevel } = require('../../utils/xpStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your (or someone else\'s) level and XP')
    .addUserOption((o) => o.setName('user').setDescription('User to check')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const record = getUser(interaction.guild.id, target.id);
    const needed = xpForLevel(record.level);
    const barLength = 20;
    const filled = Math.round((record.xp / needed) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Rank — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setColor(0x5865f2)
      .addFields(
        { name: 'Level', value: `${record.level}`, inline: true },
        { name: 'XP', value: `${record.xp} / ${needed}`, inline: true },
        { name: 'Progress', value: bar }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
