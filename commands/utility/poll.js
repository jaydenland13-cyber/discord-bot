const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a reaction poll')
    .addStringOption((o) => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption((o) =>
      o.setName('options').setDescription('Comma-separated options (2-10). Leave blank for a Yes/No poll.')
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsRaw = interaction.options.getString('options');

    let options = [];
    if (optionsRaw) {
      options = optionsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length < 2 || options.length > 10) {
        return interaction.reply({ content: '❌ Provide between 2 and 10 options.', ephemeral: true });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 ' + question)
      .setColor(0x5865f2)
      .setFooter({ text: `Poll by ${interaction.user.tag}` })
      .setTimestamp();

    let emojis;
    if (options.length === 0) {
      emojis = ['👍', '👎'];
      embed.setDescription('React with 👍 or 👎');
    } else {
      emojis = NUMBER_EMOJIS.slice(0, options.length);
      embed.setDescription(options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
    const message = await interaction.fetchReply();
    for (const emoji of emojis) {
      await message.react(emoji);
    }
  },
};
