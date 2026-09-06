const { PermissionsBitField } = require('discord.js');
const config = require('../config');
const { logToModChannel } = require('./modLog');

const INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;

// userId -> array of message timestamps (ms), for spam detection
const recentMessages = new Map();

function isStaff(member) {
  if (!member) return false;
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
    (config.supportRoleId && member.roles.cache.has(config.supportRoleId))
  );
}

function containsBannedWord(content) {
  if (!config.automod.bannedWords.length) return null;
  const lower = content.toLowerCase();
  return config.automod.bannedWords.find((w) => lower.includes(w)) || null;
}

function checkSpam(userId) {
  const now = Date.now();
  const windowMs = config.automod.spamWindowMs;
  const timestamps = (recentMessages.get(userId) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  recentMessages.set(userId, timestamps);
  return timestamps.length >= config.automod.spamCount;
}

/**
 * Runs all auto-mod checks against a message. If a violation is found, the
 * message is deleted (and, for spam, the member is briefly timed out) and a
 * mod-log entry is posted. Returns true if the message was actioned.
 */
async function runAutomod(message) {
  if (!config.automod.enabled) return false;
  if (message.author.bot) return false;
  if (isStaff(message.member)) return false;

  let reason = null;

  const bannedWord = containsBannedWord(message.content);
  if (bannedWord) {
    reason = 'Banned word/phrase detected';
  } else if (config.automod.blockInvites && INVITE_REGEX.test(message.content)) {
    reason = 'Discord invite link';
  } else if (message.mentions.users.size > config.automod.maxMentions) {
    reason = `Mass mentions (${message.mentions.users.size})`;
  } else if (checkSpam(message.author.id)) {
    reason = 'Message spam';
  }

  if (!reason) return false;

  const content = message.content;
  await message.delete().catch(() => {});

  if (reason === 'Message spam' && message.member?.moderatable) {
    await message.member.timeout(60 * 1000, 'Auto-mod: spam').catch(() => {});
  }

  const warning = await message.channel
    .send({ content: `${message.author}, that message was removed by auto-mod (${reason}).` })
    .catch(() => null);
  if (warning) setTimeout(() => warning.delete().catch(() => {}), 6000);

  await logToModChannel(message.guild, {
    title: '🛑 Auto-mod Action',
    color: 0xed4245,
    fields: [
      { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Reason', value: reason, inline: true },
      { name: 'Message Content', value: content?.slice(0, 1000) || '*(empty)*' },
    ],
  });

  return true;
}

module.exports = { runAutomod };
