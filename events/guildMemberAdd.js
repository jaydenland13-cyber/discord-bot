const { EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../config');
const { logToModChannel } = require('../utils/modLog');

/**
 * Finds a welcome channel to post in. Priority:
 * 1. A channel literally named "welcome"
 * 2. The guild's configured system channel
 * 3. The first text channel the bot can send in
 */
function findWelcomeChannel(guild) {
  const named = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && /welcome/i.test(c.name)
  );
  if (named) return named;

  if (guild.systemChannel) return guild.systemChannel;

  return guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has('SendMessages')
  );
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (config.autoRoleId) {
      const role = member.guild.roles.cache.get(config.autoRoleId);
      if (role) {
        member.roles.add(role).catch((err) => console.error('Auto-role assignment failed:', err));
      }
    }

    logToModChannel(member.guild, {
      title: '📥 Member Joined',
      color: 0x57f287,
      fields: [
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      ],
    });

    const channel = config.welcomeEnabled ? findWelcomeChannel(member.guild) : null;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('👋 Welcome!')
      .setDescription(
        `Welcome to **${member.guild.name}**, ${member}!\n\n` +
          `We're glad to have you here. Check out the rules and feel free to open a support ticket any time you need help — ` +
          `our AI assistant is on standby 24/7.`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setColor(0x57f287)
      .setFooter({ text: `Member #${member.guild.memberCount}` })
      .setTimestamp();

    channel.send({ content: `${member}`, embeds: [embed] }).catch((err) => {
      console.error('Failed to send welcome message:', err);
    });
  },
};
