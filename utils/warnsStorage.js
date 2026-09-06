const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'warns.json');

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

function addWarn(guildId, userId, reason, moderatorId) {
  const data = readAll();
  const key = `${guildId}:${userId}`;
  if (!data[key]) data[key] = [];
  const entry = { reason, moderatorId, timestamp: Date.now() };
  data[key].push(entry);
  writeAll(data);
  return data[key].length;
}

function getWarns(guildId, userId) {
  const data = readAll();
  return data[`${guildId}:${userId}`] || [];
}

function clearWarns(guildId, userId) {
  const data = readAll();
  const key = `${guildId}:${userId}`;
  const count = (data[key] || []).length;
  delete data[key];
  writeAll(data);
  return count;
}

module.exports = { addWarn, getWarns, clearWarns };
