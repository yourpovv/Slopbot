import db from './db';
import { WarnEntry } from '../types';

db.exec(`
  CREATE TABLE IF NOT EXISTS warns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    mod_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);

export function add(guildId: string, userId: string, reason: string, modId: string): void {
  db.prepare(
    'INSERT INTO warns (guild_id, user_id, reason, mod_id, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).run(guildId, userId, reason, modId, Date.now());
}

export function list(guildId: string, userId: string): WarnEntry[] {
  return db.prepare(
    'SELECT id, guild_id as guildId, user_id as userId, reason, mod_id as modId, timestamp FROM warns WHERE guild_id = ? AND user_id = ?'
  ).all(guildId, userId) as WarnEntry[];
}

export function clear(guildId: string, userId: string): number {
  const info = db.prepare(
    'DELETE FROM warns WHERE guild_id = ? AND user_id = ?'
  ).run(guildId, userId);
  return info.changes;
}

export function count(guildId: string, userId: string): number {
  const row = db.prepare(
    'SELECT COUNT(*) as cnt FROM warns WHERE guild_id = ? AND user_id = ?'
  ).get(guildId, userId) as { cnt: number };
  return row.cnt;
}
