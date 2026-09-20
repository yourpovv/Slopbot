import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS starboard_config (
    guildId TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    starsNeeded INTEGER DEFAULT 3,
    emoji TEXT DEFAULT '⭐',
    allowSelf INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS starboard_ignore (
    guildId TEXT NOT NULL,
    entityId TEXT NOT NULL,
    entityType TEXT NOT NULL,
    PRIMARY KEY (guildId, entityId)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS starboard_messages (
    guildId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    starboardMessageId TEXT,
    starCount INTEGER DEFAULT 0,
    PRIMARY KEY (guildId, messageId)
  )
`);

export interface StarboardConfig {
  guildId: string;
  channelId: string;
  starsNeeded: number;
  emoji: string;
  allowSelf: boolean;
}

export function getStarboardConfig(guildId: string): StarboardConfig | null {
  const stmt = db.prepare('SELECT * FROM starboard_config WHERE guildId = ?');
  const row = stmt.get(guildId) as any;
  
  if (!row) return null;
  
  return {
    guildId: row.guildId,
    channelId: row.channelId,
    starsNeeded: row.starsNeeded,
    emoji: row.emoji,
    allowSelf: row.allowSelf === 1,
  };
}

export function setupStarboard(guildId: string, channelId: string): void {
  db.prepare(`
    INSERT INTO starboard_config (guildId, channelId)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET channelId = ?
  `).run(guildId, channelId, channelId);
}

export function setStarboardStars(guildId: string, count: number): void {
  db.prepare('UPDATE starboard_config SET starsNeeded = ? WHERE guildId = ?').run(count, guildId);
}

export function setStarboardEmoji(guildId: string, emoji: string): void {
  db.prepare('UPDATE starboard_config SET emoji = ? WHERE guildId = ?').run(emoji, guildId);
}

export function setStarboardAllowSelf(guildId: string, allow: boolean): void {
  db.prepare('UPDATE starboard_config SET allowSelf = ? WHERE guildId = ?').run(allow ? 1 : 0, guildId);
}

export function disableStarboard(guildId: string): void {
  db.prepare('DELETE FROM starboard_config WHERE guildId = ?').run(guildId);
}

export function addStarboardIgnore(guildId: string, entityId: string, entityType: 'channel' | 'role' | 'user'): void {
  db.prepare(`
    INSERT INTO starboard_ignore (guildId, entityId, entityType)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, entityId) DO UPDATE SET entityType = ?
  `).run(guildId, entityId, entityType, entityType);
}

export function isIgnored(guildId: string, entityId: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM starboard_ignore WHERE guildId = ? AND entityId = ?');
  return stmt.get(guildId, entityId) !== undefined;
}

export function getStarboardMessage(guildId: string, messageId: string): { starboardMessageId: string | null; starCount: number } | null {
  const stmt = db.prepare('SELECT starboardMessageId, starCount FROM starboard_messages WHERE guildId = ? AND messageId = ?');
  return stmt.get(guildId, messageId) as any;
}

export function saveStarboardMessage(guildId: string, messageId: string, starboardMessageId: string, starCount: number): void {
  db.prepare(`
    INSERT INTO starboard_messages (guildId, messageId, starboardMessageId, starCount)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guildId, messageId) DO UPDATE SET starboardMessageId = ?, starCount = ?
  `).run(guildId, messageId, starboardMessageId, starCount, starboardMessageId, starCount);
}

export function updateStarCount(guildId: string, messageId: string, starCount: number): void {
  db.prepare('UPDATE starboard_messages SET starCount = ? WHERE guildId = ? AND messageId = ?').run(starCount, guildId, messageId);
}

export function deleteStarboardMessage(guildId: string, messageId: string): void {
  db.prepare('DELETE FROM starboard_messages WHERE guildId = ? AND messageId = ?').run(guildId, messageId);
}
