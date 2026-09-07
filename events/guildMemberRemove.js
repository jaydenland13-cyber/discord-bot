const { logToModChannel } = require('../utils/modLog');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .map((r) => r.name)
      .join(', ');

    await logToModChannel(member.guild, {
      title: '📤 Member Left',
      color: 0xed4245,
      fields: [
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Roles', value: roles || 'None' },
      ],
    });
  },
};
