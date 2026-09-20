import db from './db';
import { BRAND } from '../config';

db.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    guild_id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

export function setBrand(guildId: string, brandName: string): void {
  const stmt = db.prepare(`
    INSERT INTO brands (guild_id, brand_name, updated_at)
    VALUES (?, ?, strftime('%s', 'now'))
    ON CONFLICT(guild_id) DO UPDATE SET
      brand_name = excluded.brand_name,
      updated_at = excluded.updated_at
  `);
  stmt.run(guildId, brandName);
}

export function getBrand(guildId: string): string {
  const stmt = db.prepare('SELECT brand_name FROM brands WHERE guild_id = ?');
  const row = stmt.get(guildId) as { brand_name: string } | undefined;
  return row?.brand_name || BRAND;
}
