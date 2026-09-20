import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS verified (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS verify_config (
    guild_id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT
  )
`);

export function markVerified(guildId: string, userId: string): void {
  db.prepare(
    'INSERT OR IGNORE INTO verified (guild_id, user_id) VALUES (?, ?)'
  ).run(guildId, userId);
}

export function isVerified(guildId: string, userId: string): boolean {
  return !!db.prepare(
    'SELECT 1 FROM verified WHERE guild_id = ? AND user_id = ?'
  ).get(guildId, userId);
}

export function setConfig(guildId: string, roleId: string, channelId: string, messageId?: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO verify_config (guild_id, role_id, channel_id, message_id) VALUES (?, ?, ?, ?)'
  ).run(guildId, roleId, channelId, messageId ?? null);
}

export function getConfig(guildId: string): { role_id: string; channel_id: string; message_id: string | null } | undefined {
  return db.prepare(
    'SELECT role_id, channel_id, message_id FROM verify_config WHERE guild_id = ?'
  ).get(guildId) as { role_id: string; channel_id: string; message_id: string | null } | undefined;
}
