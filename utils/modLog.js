const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Sends an embed to the configured MOD_LOG_CHANNEL_ID, if set.
 * Fails silently (just logs to console) if the channel is missing or unreachable.
 */
async function logToModChannel(guild, { title, color = 0x5865f2, fields = [], description } = {}) {
  if (!config.modLogChannelId) return;

  const channel = guild.channels.cache.get(config.modLogChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);

  channel.send({ embeds: [embed] }).catch((err) => {
    console.error('Failed to send mod log:', err);
  });
}

module.exports = { logToModChannel };
