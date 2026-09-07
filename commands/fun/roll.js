const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice')
    .addIntegerOption((o) => o.setName('sides').setDescription('Sides per die (default 6)').setMinValue(2).setMaxValue(1000))
    .addIntegerOption((o) => o.setName('count').setDescription('Number of dice (default 1)').setMinValue(1).setMaxValue(20)),

  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const count = interaction.options.getInteger('count') || 1;

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);

    await interaction.reply({
      content: `🎲 Rolling ${count}d${sides}: [${rolls.join(', ')}]${count > 1 ? ` — total **${total}**` : ''}`,
    });
  },
};
