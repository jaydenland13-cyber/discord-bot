const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show info about this server'),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setColor(0x5865f2)
      .addFields(
        { name: 'Owner', value: owner ? owner.user.tag : 'Unknown', inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Text Channels', value: `${guild.channels.cache.filter((c) => c.type === 0).size}`, inline: true },
        { name: 'Voice Channels', value: `${guild.channels.cache.filter((c) => c.type === 2).size}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
