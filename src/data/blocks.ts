import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, user_id, blocked_id)
  )
`);

export function block(guildId: string, userId: string, blockedId: string): void {
  db.prepare(
    'INSERT OR IGNORE INTO blocks (guild_id, user_id, blocked_id) VALUES (?, ?, ?)'
  ).run(guildId, userId, blockedId);
}

export function unblock(guildId: string, userId: string, blockedId: string): void {
  db.prepare(
    'DELETE FROM blocks WHERE guild_id = ? AND user_id = ? AND blocked_id = ?'
  ).run(guildId, userId, blockedId);
}

export function isBlocked(guildId: string, userId: string, blockedId: string): boolean {
  const row = db.prepare(
    'SELECT 1 FROM blocks WHERE guild_id = ? AND user_id = ? AND blocked_id = ?'
  ).get(guildId, userId, blockedId);
  return !!row;
}

export function isBlockedByAnyone(guildId: string, blockedId: string): string[] {
  const rows = db.prepare(
    'SELECT user_id FROM blocks WHERE guild_id = ? AND blocked_id = ?'
  ).all(guildId, blockedId) as { user_id: string }[];
  return rows.map(r => r.user_id);
}

export function getBlockedIds(guildId: string, userId: string): string[] {
  const rows = db.prepare(
    'SELECT blocked_id FROM blocks WHERE guild_id = ? AND user_id = ?'
  ).all(guildId, userId) as { blocked_id: string }[];
  return rows.map(r => r.blocked_id);
}
