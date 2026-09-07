const { logToModChannel } = require('../utils/modLog');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    if (message.partial) return; // content unavailable for uncached messages

    await logToModChannel(message.guild, {
      title: '🗑️ Message Deleted',
      color: 0xed4245,
      fields: [
        { name: 'Author', value: message.author ? `${message.author.tag}` : 'Unknown', inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Content', value: message.content?.slice(0, 1000) || '*(no text content)*' },
      ],
    });
  },
};
