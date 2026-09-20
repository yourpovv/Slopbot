import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    inviteLink TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  )
`);

export interface Ad {
  id: number;
  guildId: string;
  name: string;
  inviteLink: string;
  createdBy: string;
  createdAt: number;
}

export function createAd(guildId: string, name: string, inviteLink: string, createdBy: string): number {
  const result = db.prepare(`
    INSERT INTO ads (guildId, name, inviteLink, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(guildId, name, inviteLink, createdBy, Date.now());
  
  return result.lastInsertRowid as number;
}

export function getAd(guildId: string, id: number): Ad | null {
  const stmt = db.prepare('SELECT * FROM ads WHERE guildId = ? AND id = ?');
  const row = stmt.get(guildId, id) as Ad | undefined;
  return row ?? null;
}

export function getAdByName(guildId: string, name: string): Ad | null {
  const stmt = db.prepare('SELECT * FROM ads WHERE guildId = ? AND name = ? COLLATE NOCASE');
  const row = stmt.get(guildId, name) as Ad | undefined;
  return row ?? null;
}

export function getAllAds(guildId: string): Ad[] {
  const stmt = db.prepare('SELECT * FROM ads WHERE guildId = ? ORDER BY createdAt DESC');
  return stmt.all(guildId) as Ad[];
}

export function updateAd(guildId: string, id: number, name: string, inviteLink: string): boolean {
  const result = db.prepare(`
    UPDATE ads SET name = ?, inviteLink = ?
    WHERE guildId = ? AND id = ?
  `).run(name, inviteLink, guildId, id);
  
  return result.changes > 0;
}

export function deleteAd(guildId: string, id: number): boolean {
  const result = db.prepare('DELETE FROM ads WHERE guildId = ? AND id = ?').run(guildId, id);
  return result.changes > 0;
}
