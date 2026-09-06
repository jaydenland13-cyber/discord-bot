const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Help')
      .setColor(0x5865f2)
      .addFields(
        {
          name: '🤖 AI & Support',
          value: '`/ai <question>` — Ask the AI assistant a question anywhere.\nAI also auto-replies inside open tickets until claimed by staff.',
        },
        {
          name: '🎫 Tickets',
          value:
            '`/ticket-panel` — (Staff) Post the "Open a Ticket" button panel.\nInside a ticket: **Claim** and **Close Ticket** buttons.',
        },
        {
          name: '🛡️ Moderation',
          value:
            '`/ban` `/kick` `/timeout` `/warn add|list|clear` `/clear` — staff-only, permission gated.',
        },
        {
          name: '🧰 Utility',
          value: '`/userinfo` `/serverinfo` `/avatar` `/poll` `/help`',
        },
        {
          name: '📢 Staff',
          value: '`/announce` — Post a formatted announcement to a channel.',
        }
      )
      .setFooter({ text: 'All-in-one bot' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
