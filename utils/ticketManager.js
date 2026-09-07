const fs = require('fs');
const path = require('path');
const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const config = require('../config');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'tickets.json');

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

function getTicket(channelId) {
  return readAll()[channelId] || null;
}

function saveTicket(channelId, record) {
  const data = readAll();
  data[channelId] = record;
  writeAll(data);
}

function deleteTicket(channelId) {
  const data = readAll();
  delete data[channelId];
  writeAll(data);
}

function ticketControlRow(claimed) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel(claimed ? 'Claimed' : 'Claim')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );
}

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_open')
      .setLabel('🎫 Open a Ticket')
      .setStyle(ButtonStyle.Success)
  );
}

async function openTicket(interaction) {
  const { guild, user } = interaction;

  const existing = Object.entries(readAll()).find(
    ([, t]) => t.guildId === guild.id && t.userId === user.id && !t.closed
  );
  if (existing) {
    return interaction.reply({
      content: `You already have an open ticket: <#${existing[0]}>`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
  ];

  if (config.supportRoleId) {
    overwrites.push({
      id: config.supportRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId || undefined,
    permissionOverwrites: overwrites,
    topic: `Ticket for ${user.id}`,
  });

  saveTicket(channel.id, {
    guildId: guild.id,
    userId: user.id,
    claimedBy: null,
    closed: false,
    aiEnabled: true,
    createdAt: Date.now(),
    history: [],
  });

  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Ticket')
    .setDescription(
      `Hi ${user}, thanks for reaching out!\n\n` +
        `Describe your issue below and our AI assistant will try to help right away. ` +
        `A staff member can claim this ticket at any time.`
    )
    .setColor(0x5865f2)
    .setTimestamp();

  await channel.send({
    content: config.supportRoleId ? `<@&${config.supportRoleId}>` : undefined,
    embeds: [embed],
    components: [ticketControlRow(false)],
  });

  await interaction.editReply({ content: `Your ticket has been created: ${channel}` });
}

async function claimTicket(interaction) {
  const ticket = getTicket(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: 'This is not an active ticket channel.', ephemeral: true });
  }
  if (ticket.claimedBy) {
    return interaction.reply({ content: `Already claimed by <@${ticket.claimedBy}>.`, ephemeral: true });
  }

  ticket.claimedBy = interaction.user.id;
  ticket.aiEnabled = false; // staff has it now, stop auto AI replies
  saveTicket(interaction.channel.id, ticket);

  await interaction.reply({ content: `🙋 Ticket claimed by ${interaction.user}. AI auto-replies are now paused.` });
  await interaction.message.edit({ components: [ticketControlRow(true)] });
}

async function closeTicket(interaction) {
  const ticket = getTicket(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: 'This is not an active ticket channel.', ephemeral: true });
  }

  await interaction.reply({ content: '🔒 Closing this ticket in 5 seconds...' });

  if (config.ticketLogChannelId) {
    const logChannel = interaction.guild.channels.cache.get(config.ticketLogChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Ticket Closed')
        .addFields(
          { name: 'Channel', value: `#${interaction.channel.name}`, inline: true },
          { name: 'Opened by', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Claimed by', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Unclaimed', inline: true },
          { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor(0xed4245)
        .setTimestamp();
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }

  deleteTicket(interaction.channel.id);
  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

module.exports = {
  getTicket,
  saveTicket,
  deleteTicket,
  openTicket,
  claimTicket,
  closeTicket,
  panelRow,
  ticketControlRow,
};
