require('dotenv').config();

function req(name, fallback = undefined) {
  const val = process.env[name] ?? fallback;
  return val;
}

module.exports = {
  token: req('DISCORD_TOKEN'),
  clientId: req('CLIENT_ID'),
  guildId: req('GUILD_ID', ''),

  geminiApiKey: req('GEMINI_API_KEY'),
  geminiModel: req('GEMINI_MODEL', 'gemini-3.6-flash'),

  ownerId: req('OWNER_ID', ''),

  ticketCategoryId: req('TICKET_CATEGORY_ID', ''),
  supportRoleId: req('SUPPORT_ROLE_ID', ''),
  ticketLogChannelId: req('TICKET_LOG_CHANNEL_ID', ''),

  announceChannelId: req('ANNOUNCE_CHANNEL_ID', ''),

  customCommandPrefix: req('CUSTOM_COMMAND_PREFIX', '!'),
  xp: {
    enabled: req('XP_ENABLED', 'true') === 'true',
    perMessage: parseInt(req('XP_PER_MESSAGE', '15'), 10),
    cooldownMs: parseInt(req('XP_COOLDOWN_SECONDS', '60'), 10) * 1000,
    announceLevelUp: req('XP_ANNOUNCE_LEVEL_UP', 'true') === 'true',
  },

  // Moderation / automod
  modLogChannelId: req('MOD_LOG_CHANNEL_ID', ''),
  autoRoleId: req('AUTO_ROLE_ID', ''),
  automod: {
    enabled: req('AUTOMOD_ENABLED', 'true') === 'true',
    bannedWords: req('AUTOMOD_BANNED_WORDS', '')
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean),
    blockInvites: req('AUTOMOD_BLOCK_INVITES', 'true') === 'true',
    maxMentions: parseInt(req('AUTOMOD_MAX_MENTIONS', '5'), 10),
    spamCount: parseInt(req('AUTOMOD_SPAM_COUNT', '5'), 10),
    spamWindowMs: parseInt(req('AUTOMOD_SPAM_WINDOW_SECONDS', '7'), 10) * 1000,
  },
};
