const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

if (!config.token || !config.clientId) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in your .env file.');
  process.exit(1);
}

function loadCommandData(dir) {
  let commands = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      commands = commands.concat(loadCommandData(fullPath));
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data) commands.push(command.data.toJSON());
    }
  }
  return commands;
}

const commands = loadCommandData(path.join(__dirname, 'commands'));
const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`⏳ Deploying ${commands.length} slash command(s)...`);

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });

    console.log(
      config.guildId
        ? `✅ Deployed commands to guild ${config.guildId} (instant).`
        : '✅ Deployed commands globally (may take up to ~1 hour to appear everywhere).'
    );
  } catch (err) {
    console.error('❌ Failed to deploy commands:', err);
  }
})();
