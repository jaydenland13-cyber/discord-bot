const { openTicket, claimTicket, closeTicket } = require('../utils/ticketManager');
const { enterGiveaway } = require('../utils/giveawayManager');

async function handleRolePanel(interaction) {
  const roleId = interaction.customId.split(':')[1];
  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    return interaction.reply({ content: '❌ That role no longer exists.', ephemeral: true });
  }

  const member = interaction.member;
  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.reply({ content: `➖ Removed **${role.name}**.`, ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `➕ Added **${role.name}**.`, ephemeral: true });
    }
  } catch (err) {
    console.error('Role panel toggle failed:', err);
    await interaction.reply({ content: "❌ I couldn't update that role — check my role position/permissions.", ephemeral: true });
  }
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        const { customId } = interaction;

        if (customId === 'ticket_open') return openTicket(interaction);
        if (customId === 'ticket_claim') return claimTicket(interaction);
        if (customId === 'ticket_close') return closeTicket(interaction);
        if (customId === 'giveaway_enter') return enterGiveaway(interaction);
        if (customId.startsWith('rolepanel:')) return handleRolePanel(interaction);

        return;
      }
    } catch (err) {
      console.error('Interaction error:', err);
      const payload = { content: '❌ Something went wrong handling that.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
