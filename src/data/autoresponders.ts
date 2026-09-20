import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS autoresponders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    matchFull INTEGER DEFAULT 0,
    replyMode INTEGER DEFAULT 0,
    deleteTrigger INTEGER DEFAULT 0,
    waitSeconds INTEGER DEFAULT 5,
    enabled INTEGER DEFAULT 1,
    createdBy TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS autoresponder_usage (
    responderId INTEGER PRIMARY KEY,
    lastTriggered INTEGER DEFAULT 0,
    FOREIGN KEY(responderId) REFERENCES autoresponders(id) ON DELETE CASCADE
  )
`);

export interface Autoresponder {
  id: number;
  guildId: string;
  trigger: string;
  response: string;
  matchFull: boolean;
  replyMode: boolean;
  deleteTrigger: boolean;
  waitSeconds: number;
  enabled: boolean;
  createdBy: string;
}

export function getActiveResponders(guildId: string): Autoresponder[] {
  const stmt = db.prepare('SELECT * FROM autoresponders WHERE guildId = ? AND enabled = 1');
  const rows = stmt.all(guildId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    guildId: row.guildId,
    trigger: row.trigger,
    response: row.response,
    matchFull: row.matchFull === 1,
    replyMode: row.replyMode === 1,
    deleteTrigger: row.deleteTrigger === 1,
    waitSeconds: row.waitSeconds,
    enabled: row.enabled === 1,
    createdBy: row.createdBy,
  }));
}

export function getAllResponders(guildId: string): Autoresponder[] {
  const stmt = db.prepare('SELECT * FROM autoresponders WHERE guildId = ?');
  const rows = stmt.all(guildId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    guildId: row.guildId,
    trigger: row.trigger,
    response: row.response,
    matchFull: row.matchFull === 1,
    replyMode: row.replyMode === 1,
    deleteTrigger: row.deleteTrigger === 1,
    waitSeconds: row.waitSeconds,
    enabled: row.enabled === 1,
    createdBy: row.createdBy,
  }));
}

export function addResponder(
  guildId: string,
  trigger: string,
  response: string,
  createdBy: string,
  options: {
    matchFull?: boolean;
    replyMode?: boolean;
    deleteTrigger?: boolean;
    waitSeconds?: number;
  } = {}
): number {
  const result = db.prepare(`
    INSERT INTO autoresponders (guildId, trigger, response, matchFull, replyMode, deleteTrigger, waitSeconds, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    guildId,
    trigger,
    response,
    options.matchFull ? 1 : 0,
    options.replyMode ? 1 : 0,
    options.deleteTrigger ? 1 : 0,
    options.waitSeconds ?? 5,
    createdBy
  );
  
  return result.lastInsertRowid as number;
}

export function removeResponder(id: number, guildId: string): boolean {
  const result = db.prepare('DELETE FROM autoresponders WHERE id = ? AND guildId = ?').run(id, guildId);
  return result.changes > 0;
}

export function toggleResponder(id: number, guildId: string): boolean {
  const stmt = db.prepare('SELECT enabled FROM autoresponders WHERE id = ? AND guildId = ?');
  const row = stmt.get(id, guildId) as { enabled: number } | undefined;
  
  if (!row) return false;
  
  const newState = row.enabled === 1 ? 0 : 1;
  db.prepare('UPDATE autoresponders SET enabled = ? WHERE id = ? AND guildId = ?').run(newState, id, guildId);
  
  return true;
}

export function editResponder(id: number, guildId: string, field: 'trigger' | 'response', value: string): boolean {
  const result = db.prepare(`UPDATE autoresponders SET ${field} = ? WHERE id = ? AND guildId = ?`).run(value, id, guildId);
  return result.changes > 0;
}

export function resetResponders(guildId: string): void {
  db.prepare('DELETE FROM autoresponders WHERE guildId = ?').run(guildId);
}

export function checkWait(responderId: number): boolean {
  const stmt = db.prepare('SELECT lastTriggered FROM autoresponder_usage WHERE responderId = ?');
  const row = stmt.get(responderId) as { lastTriggered: number } | undefined;
  
  if (!row) return true;
  
  const responder = db.prepare('SELECT waitSeconds FROM autoresponders WHERE id = ?').get(responderId) as { waitSeconds: number };
  const now = Math.floor(Date.now() / 1000);
  
  return (now - row.lastTriggered) >= responder.waitSeconds;
}

export function updateUsage(responderId: number): void {
  const now = Math.floor(Date.now() / 1000);
  
  db.prepare(`
    INSERT INTO autoresponder_usage (responderId, lastTriggered)
    VALUES (?, ?)
    ON CONFLICT(responderId) DO UPDATE SET lastTriggered = ?
  `).run(responderId, now, now);
}
