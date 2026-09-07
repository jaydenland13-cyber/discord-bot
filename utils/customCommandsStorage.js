const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'customcommands.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}), 'utf8');
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function addCommand(guildId, trigger, response) {
  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  data[guildId][trigger.toLowerCase()] = response;
  writeAll(data);
}

function removeCommand(guildId, trigger) {
  const data = readAll();
  if (!data[guildId]) return false;
  const existed = trigger.toLowerCase() in data[guildId];
  delete data[guildId][trigger.toLowerCase()];
  writeAll(data);
  return existed;
}

function getCommand(guildId, trigger) {
  const data = readAll();
  return data[guildId]?.[trigger.toLowerCase()] || null;
}

function listCommands(guildId) {
  const data = readAll();
  return Object.keys(data[guildId] || {});
}

module.exports = { addCommand, removeCommand, getCommand, listCommands };
