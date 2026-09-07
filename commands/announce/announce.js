const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('(Staff) Post a formatted announcement')
    .addStringOption((o) => o.setName('message').setDescription('Announcement content').setRequired(true))
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to post in (defaults to the configured announcement channel)')
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((o) => o.setName('title').setDescription('Announcement title'))
    .addBooleanOption((o) => o.setName('ping_everyone').setDescription('Include an @everyone ping? (default: false)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const title = interaction.options.getString('title') || '📢 Announcement';
    const pingEveryone = interaction.options.getBoolean('ping_everyone') || false;

    const channel =
      interaction.options.getChannel('channel') ||
      (config.announceChannelId ? interaction.guild.channels.cache.get(config.announceChannelId) : null) ||
      interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(0xfee75c)
      .setFooter({ text: `Posted by ${interaction.user.tag}` })
      .setTimestamp();

    try {
      await channel.send({ content: pingEveryone ? '@everyone' : undefined, embeds: [embed] });
      await interaction.reply({ content: `✅ Announcement posted in ${channel}.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to post the announcement (check my permissions in that channel).', ephemeral: true });
    }
  },
};
