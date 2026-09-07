const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'xp.json');

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

// XP needed to reach the NEXT level from `level`
function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

/**
 * Adds XP to a user (respecting a per-user cooldown to prevent spam-leveling).
 * Returns { leveledUp, newLevel } if XP was granted, or null if on cooldown.
 */
function addXp(guildId, userId, amount, cooldownMs = 60000) {
  const data = readAll();
  const key = `${guildId}:${userId}`;
  const record = data[key] || { xp: 0, level: 0, lastAward: 0 };

  const now = Date.now();
  if (now - record.lastAward < cooldownMs) return null;

  record.xp += amount;
  record.lastAward = now;

  let leveledUp = false;
  while (record.xp >= xpForLevel(record.level)) {
    record.xp -= xpForLevel(record.level);
    record.level += 1;
    leveledUp = true;
  }

  data[key] = record;
  writeAll(data);

  return { leveledUp, newLevel: record.level, xp: record.xp, xpNeeded: xpForLevel(record.level) };
}

function getUser(guildId, userId) {
  const data = readAll();
  return data[`${guildId}:${userId}`] || { xp: 0, level: 0, lastAward: 0 };
}

function getLeaderboard(guildId, limit = 10) {
  const data = readAll();
  return Object.entries(data)
    .filter(([key]) => key.startsWith(`${guildId}:`))
    .map(([key, val]) => ({ userId: key.split(':')[1], ...val }))
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .slice(0, limit);
}

module.exports = { addXp, getUser, getLeaderboard, xpForLevel };
