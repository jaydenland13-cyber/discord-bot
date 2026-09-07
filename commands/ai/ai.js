const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askGemini } = require('../../utils/gemini');
const { wantsStaff } = require('../../utils/staffPing');
const config = require('../../config');

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

    const pingText = wantsStaff(question) && config.supportRoleId ? `<@&${config.supportRoleId}> — needed here.\n` : '';

    await interaction.editReply({ content: pingText || undefined, embeds: [embed] });
  },
};
