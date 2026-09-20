import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS nerdifies (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    nerdified_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, user_id, nerdified_id)
  )
`);

export function nerdify(guildId: string, userId: string, nerdifiedId: string): void {
  db.prepare(
    'INSERT OR IGNORE INTO nerdifies (guild_id, user_id, nerdified_id) VALUES (?, ?, ?)'
  ).run(guildId, userId, nerdifiedId);
}

export function unnerdify(guildId: string, userId: string, nerdifiedId: string): void {
  db.prepare(
    'DELETE FROM nerdifies WHERE guild_id = ? AND user_id = ? AND nerdified_id = ?'
  ).run(guildId, userId, nerdifiedId);
}

export function isNerdified(guildId: string, userId: string, nerdifiedId: string): boolean {
  const row = db.prepare(
    'SELECT 1 FROM nerdifies WHERE guild_id = ? AND user_id = ? AND nerdified_id = ?'
  ).get(guildId, userId, nerdifiedId);
  return !!row;
}

export function isNerdifiedByAnyone(guildId: string, nerdifiedId: string): string[] {
  const rows = db.prepare(
    'SELECT user_id FROM nerdifies WHERE guild_id = ? AND nerdified_id = ?'
  ).all(guildId, nerdifiedId) as { user_id: string }[];
  return rows.map(r => r.user_id);
}

export function getNerdifiedIds(guildId: string, userId: string): string[] {
  const rows = db.prepare(
    'SELECT nerdified_id FROM nerdifies WHERE guild_id = ? AND user_id = ?'
  ).all(guildId, userId) as { nerdified_id: string }[];
  return rows.map(r => r.nerdified_id);
}
