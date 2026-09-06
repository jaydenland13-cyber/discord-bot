const { PermissionsBitField } = require('discord.js');
const config = require('../config');
const { askGemini } = require('../utils/gemini');
const { getTicket, saveTicket } = require('../utils/ticketManager');
const { runAutomod } = require('../utils/automod');
const { addXp } = require('../utils/xpStorage');
const { getCommand } = require('../utils/customCommandsStorage');

const MAX_HISTORY_TURNS = 6; // keep prompt small

async function handleOwnerProtection(message) {
  if (!config.ownerId) return false;
  if (!message.mentions.users.has(config.ownerId)) return false;
  if (message.author.id === config.ownerId) return false;
  if (message.author.id === message.guild.ownerId) return false;

  const member = message.member;
  const isStaff =
    member?.permissions.has(PermissionsBitField.Flags.Administrator) ||
    (config.supportRoleId && member?.roles.cache.has(config.supportRoleId));

  if (isStaff) return false;

  try {
    await message.delete();
    const warning = await message.channel.send({
      content: `${message.author}, please don't mention the server owner directly. A staff member can help you instead.`,
    });
    setTimeout(() => warning.delete().catch(() => {}), 8000);
  } catch (err) {
    console.error('Owner-protection delete failed:', err);
  }

  return true;
}

async function handleTicketAI(message) {
  const ticket = getTicket(message.channel.id);
  if (!ticket || ticket.closed) return;
  if (!ticket.aiEnabled) return; // paused once staff claims
  if (message.author.id !== ticket.userId) return; // only respond to the ticket opener
  if (message.author.bot) return;

  await message.channel.sendTyping();

  const history = ticket.history || [];
  const answer = await askGemini(message.content, history.slice(-MAX_HISTORY_TURNS * 2));

  history.push({ role: 'user', text: message.content });
  history.push({ role: 'model', text: answer });
  ticket.history = history.slice(-MAX_HISTORY_TURNS * 2);
  saveTicket(message.channel.id, ticket);

  await message.reply({ content: answer.slice(0, 2000) });
}

async function handleXp(message) {
  if (!config.xp.enabled) return;
  const result = addXp(message.guild.id, message.author.id, config.xp.perMessage, config.xp.cooldownMs);
  if (result?.leveledUp && config.xp.announceLevelUp) {
    message.channel
      .send({ content: `🎉 ${message.author} leveled up to **Level ${result.newLevel}**!` })
      .catch(() => {});
  }
}

async function handleCustomCommand(message) {
  const prefix = config.customCommandPrefix;
  if (!message.content.startsWith(prefix)) return false;

  const trigger = message.content.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
  if (!trigger) return false;

  const response = getCommand(message.guild.id, trigger);
  if (!response) return false;

  await message.reply({ content: response.slice(0, 2000) });
  return true;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const wasDeleted = await handleOwnerProtection(message);
    if (wasDeleted) return;

    const wasActioned = await runAutomod(message).catch((err) => {
      console.error('Automod error:', err);
      return false;
    });
    if (wasActioned) return;

    const ranCustomCommand = await handleCustomCommand(message).catch((err) => {
      console.error('Custom command error:', err);
      return false;
    });

    await handleXp(message).catch((err) => console.error('XP error:', err));

    if (ranCustomCommand) return;

    await handleTicketAI(message).catch((err) => console.error('Ticket AI error:', err));
  },
};
