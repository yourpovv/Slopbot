import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS rep (
    guildId  TEXT NOT NULL,
    userId   TEXT NOT NULL,
    giverId  TEXT NOT NULL,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (guildId, userId, giverId)
  )
`);

const giveStmt = db.prepare(
  'INSERT OR IGNORE INTO rep (guildId, userId, giverId) VALUES (?, ?, ?)'
);

const countStmt = db.prepare(
  'SELECT COUNT(*) as total FROM rep WHERE guildId = ? AND userId = ?'
);

const alreadyStmt = db.prepare(
  'SELECT 1 FROM rep WHERE guildId = ? AND userId = ? AND giverId = ?'
);

const topStmt = db.prepare(
  'SELECT userId, COUNT(*) as total FROM rep WHERE guildId = ? GROUP BY userId ORDER BY total DESC LIMIT ?'
);

export function give(guildId: string, targetId: string, giverId: string): boolean {
  const result = giveStmt.run(guildId, targetId, giverId);
  return result.changes > 0;
}

export function count(guildId: string, userId: string): number {
  return (countStmt.get(guildId, userId) as { total: number })?.total ?? 0;
}

export function already(guildId: string, targetId: string, giverId: string): boolean {
  return !!alreadyStmt.get(guildId, targetId, giverId);
}

export function leaderboard(guildId: string, limit = 10): { userId: string; total: number }[] {
  return topStmt.all(guildId, limit) as { userId: string; total: number }[];
}
