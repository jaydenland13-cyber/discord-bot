const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askGemini } = require('../../utils/gemini');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Ask the AI assistant a question')
    .addStringOption((o) => o.setName('question').setDescription('What do you want to ask?').setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    await interaction.deferReply();

    const answer = await askGemini(question);

    const embed = new EmbedBuilder()
      .setColor(0x10a37f)
      .setAuthor({ name: 'AI Assistant' })
      .addFields({ name: 'Question', value: question.slice(0, 1024) }, { name: 'Answer', value: answer.slice(0, 1024) })
      .setFooter({ text: `Asked by ${interaction.user.tag}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
