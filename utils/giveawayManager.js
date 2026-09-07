const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'giveaways.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}), 'utf8');
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function enterButtonRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel('🎉 Enter Giveaway')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
}

function buildEmbed(giveaway) {
  return new EmbedBuilder()
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(
      `Click **Enter Giveaway** below to join!\n\n` +
        `**Winners:** ${giveaway.winnerCount}\n` +
        `**Ends:** <t:${Math.floor(giveaway.endsAt / 1000)}:R>\n` +
        `**Entries:** ${giveaway.entries.length}` +
        (giveaway.requireTag ? `\n\n🏷️ You must have this server's **tag equipped** on your profile to enter.` : '')
    )
    .setColor(0x5865f2)
    .setFooter({ text: `Hosted by ${giveaway.hostTag}` });
}

/**
 * Checks whether a guild member currently has the given guild's Server Tag equipped.
 */
function hasServerTagEquipped(user, guildId) {
  const pg = user.primaryGuild;
  return Boolean(pg && pg.identityEnabled && pg.identityGuildId === guildId);
}

async function createGiveaway(interaction, { prize, durationMs, winnerCount, requireTag }) {
  const giveaway = {
    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    messageId: null,
    prize,
    winnerCount,
    requireTag,
    hostId: interaction.user.id,
    hostTag: interaction.user.tag,
    entries: [],
    endsAt: Date.now() + durationMs,
    ended: false,
  };

  const message = await interaction.channel.send({
    embeds: [buildEmbed(giveaway)],
    components: [enterButtonRow()],
  });

  giveaway.messageId = message.id;
  const data = readAll();
  data[message.id] = giveaway;
  writeAll(data);

  scheduleEnd(interaction.client, message.id, durationMs);
  return giveaway;
}

async function enterGiveaway(interaction) {
  const data = readAll();
  const giveaway = data[interaction.message.id];

  if (!giveaway || giveaway.ended) {
    return interaction.reply({ content: '⚠️ This giveaway has already ended.', ephemeral: true });
  }

  if (giveaway.requireTag && !hasServerTagEquipped(interaction.user, giveaway.guildId)) {
    return interaction.reply({
      content:
        "❌ You need this server's **Server Tag** equipped on your profile to enter this giveaway.\n" +
        'Go to your Discord profile settings → enable this server\'s tag, then click Enter again.',
      ephemeral: true,
    });
  }

  if (giveaway.entries.includes(interaction.user.id)) {
    return interaction.reply({ content: "🎟️ You're already entered!", ephemeral: true });
  }

  giveaway.entries.push(interaction.user.id);
  data[interaction.message.id] = giveaway;
  writeAll(data);

  await interaction.reply({ content: "🎉 You're entered! Good luck.", ephemeral: true });
  await interaction.message.edit({ embeds: [buildEmbed(giveaway)] }).catch(() => {});
}

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (pool.length && winners.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function endGiveaway(client, messageId, { isReroll = false } = {}) {
  const data = readAll();
  const giveaway = data[messageId];
  if (!giveaway) return;

  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  const winners = pickWinners(giveaway.entries, giveaway.winnerCount);

  giveaway.ended = true;
  data[messageId] = giveaway;
  writeAll(data);

  const resultText = winners.length
    ? winners.map((id) => `<@${id}>`).join(', ')
    : 'No valid entries — nobody won this time.';

  if (message) {
    const endedEmbed = EmbedBuilder.from(buildEmbed(giveaway))
      .setDescription(
        `**Winner(s):** ${resultText}\n\n**Entries:** ${giveaway.entries.length}` +
          (giveaway.requireTag ? `\n🏷️ Server-tag entry required.` : '')
      )
      .setColor(0x57f287)
      .setTitle(`🎉 ${giveaway.prize} — Ended`);

    await message.edit({ embeds: [endedEmbed], components: [enterButtonRow(true)] }).catch(() => {});
  }

  if (winners.length) {
    channel
      .send({
        content: `${isReroll ? '🔁 New winner(s)' : '🎉 Congratulations'} for **${giveaway.prize}**: ${resultText}!`,
      })
      .catch(() => {});
  } else {
    channel.send({ content: `😢 No one entered **${giveaway.prize}** — no winner this time.` }).catch(() => {});
  }
}

function scheduleEnd(client, messageId, delayMs) {
  const safeDelay = Math.max(delayMs, 0);
  // setTimeout max delay is ~24.8 days; cap and re-check for very long giveaways
  const capped = Math.min(safeDelay, 2 ** 31 - 1);
  setTimeout(() => {
    endGiveaway(client, messageId).catch((err) => console.error('Giveaway end error:', err));
  }, capped);
}

/** Call once on bot startup to re-arm timers for any giveaways still in progress. */
function rescheduleAll(client) {
  const data = readAll();
  const now = Date.now();
  for (const [messageId, giveaway] of Object.entries(data)) {
    if (giveaway.ended) continue;
    const remaining = giveaway.endsAt - now;
    if (remaining <= 0) {
      endGiveaway(client, messageId).catch((err) => console.error('Giveaway end error:', err));
    } else {
      scheduleEnd(client, messageId, remaining);
    }
  }
}

function getGiveaway(messageId) {
  return readAll()[messageId] || null;
}

function resetForReroll(messageId) {
  const data = readAll();
  if (!data[messageId]) return;
  data[messageId].ended = false;
  writeAll(data);
}

module.exports = {
  createGiveaway,
  enterGiveaway,
  endGiveaway,
  rescheduleAll,
  getGiveaway,
  resetForReroll,
};
