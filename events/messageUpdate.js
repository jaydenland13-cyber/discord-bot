const { logToModChannel } = require('../utils/modLog');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.content === newMessage.content) return; // e.g. embed-only updates

    await logToModChannel(newMessage.guild, {
      title: '✏️ Message Edited',
      color: 0xf5a623,
      fields: [
        { name: 'Author', value: `${newMessage.author.tag}`, inline: true },
        { name: 'Channel', value: `${newMessage.channel}`, inline: true },
        { name: 'Before', value: oldMessage.content?.slice(0, 500) || '*(empty)*' },
        { name: 'After', value: newMessage.content?.slice(0, 500) || '*(empty)*' },
      ],
    });
  },
};
