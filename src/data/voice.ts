import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS voice_channels (
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    locked INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (guildId, channelId)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS voice_permits (
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (guildId, channelId, userId)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS join_to_create (
    guildId TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    categoryId TEXT,
    channelName TEXT DEFAULT '╰ {user}'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS temp_voice_channels (
    guildId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    PRIMARY KEY (guildId, channelId)
  )
`);

export interface VoiceChannel {
  guildId: string;
  channelId: string;
  ownerId: string;
  locked: boolean;
  createdAt: number;
}

export function getVoiceChannel(guildId: string, channelId: string): VoiceChannel | null {
  const stmt = db.prepare('SELECT * FROM voice_channels WHERE guildId = ? AND channelId = ?');
  const row = stmt.get(guildId, channelId) as any;
  
  if (!row) return null;
  
  return {
    guildId: row.guildId,
    channelId: row.channelId,
    ownerId: row.ownerId,
    locked: row.locked === 1,
    createdAt: row.createdAt,
  };
}

export function setVoiceOwner(guildId: string, channelId: string, ownerId: string): void {
  db.prepare(`
    INSERT INTO voice_channels (guildId, channelId, ownerId)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, channelId) DO UPDATE SET ownerId = ?
  `).run(guildId, channelId, ownerId, ownerId);
}

export function setVoiceLocked(guildId: string, channelId: string, locked: boolean): void {
  db.prepare('UPDATE voice_channels SET locked = ? WHERE guildId = ? AND channelId = ?').run(locked ? 1 : 0, guildId, channelId);
}

export function removeVoiceChannel(guildId: string, channelId: string): void {
  db.prepare('DELETE FROM voice_channels WHERE guildId = ? AND channelId = ?').run(guildId, channelId);
  db.prepare('DELETE FROM voice_permits WHERE guildId = ? AND channelId = ?').run(guildId, channelId);
}

export function addVoicePermit(guildId: string, channelId: string, userId: string): void {
  db.prepare(`
    INSERT INTO voice_permits (guildId, channelId, userId)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, channelId, userId) DO NOTHING
  `).run(guildId, channelId, userId);
}

export function removeVoicePermit(guildId: string, channelId: string, userId: string): void {
  db.prepare('DELETE FROM voice_permits WHERE guildId = ? AND channelId = ? AND userId = ?').run(guildId, channelId, userId);
}

export function hasVoicePermit(guildId: string, channelId: string, userId: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM voice_permits WHERE guildId = ? AND channelId = ? AND userId = ?');
  return stmt.get(guildId, channelId, userId) !== undefined;
}

export function getVoicePermits(guildId: string, channelId: string): string[] {
  const stmt = db.prepare('SELECT userId FROM voice_permits WHERE guildId = ? AND channelId = ?');
  const rows = stmt.all(guildId, channelId) as { userId: string }[];
  return rows.map(r => r.userId);
}

export interface JoinToCreateConfig {
  guildId: string;
  channelId: string;
  categoryId: string | null;
  channelName: string;
}

export function getJoinToCreateConfig(guildId: string): JoinToCreateConfig | null {
  const stmt = db.prepare('SELECT * FROM join_to_create WHERE guildId = ?');
  const row = stmt.get(guildId) as any;
  
  if (!row) return null;
  
  return {
    guildId: row.guildId,
    channelId: row.channelId,
    categoryId: row.categoryId,
    channelName: row.channelName,
  };
}

export function setJoinToCreateConfig(guildId: string, channelId: string, categoryId: string | null, channelName: string): void {
  db.prepare(`
    INSERT INTO join_to_create (guildId, channelId, categoryId, channelName)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guildId) DO UPDATE SET channelId = ?, categoryId = ?, channelName = ?
  `).run(guildId, channelId, categoryId, channelName, channelId, categoryId, channelName);
}

export function removeJoinToCreateConfig(guildId: string): void {
  db.prepare('DELETE FROM join_to_create WHERE guildId = ?').run(guildId);
}

export function addTempVoiceChannel(guildId: string, channelId: string): void {
  db.prepare(`
    INSERT INTO temp_voice_channels (guildId, channelId)
    VALUES (?, ?)
    ON CONFLICT(guildId, channelId) DO NOTHING
  `).run(guildId, channelId);
}

export function removeTempVoiceChannel(guildId: string, channelId: string): void {
  db.prepare('DELETE FROM temp_voice_channels WHERE guildId = ? AND channelId = ?').run(guildId, channelId);
}

export function isTempVoiceChannel(guildId: string, channelId: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM temp_voice_channels WHERE guildId = ? AND channelId = ?');
  return stmt.get(guildId, channelId) !== undefined;
}
