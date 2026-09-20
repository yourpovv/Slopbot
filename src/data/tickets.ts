import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    channelId TEXT PRIMARY KEY,
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    ticketNumber INTEGER NOT NULL,
    createdAt INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tickets_guild_user 
  ON tickets(guildId, userId)
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ticket_counters (
    guildId TEXT PRIMARY KEY,
    counter INTEGER NOT NULL DEFAULT 0
  )
`);

export function createTicket(guildId: string, userId: string, channelId: string): number {
  const transaction = db.transaction(() => {
    const updateStmt = db.prepare(`
      INSERT INTO ticket_counters (guildId, counter)
      VALUES (?, 1)
      ON CONFLICT(guildId) DO UPDATE SET counter = counter + 1
      RETURNING counter
    `);
    
    const result = updateStmt.get(guildId) as { counter: number };
    const ticketNumber = result.counter;
    
    db.prepare(`
      INSERT INTO tickets (channelId, guildId, userId, ticketNumber, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(channelId, guildId, userId, ticketNumber, Date.now());
    
    return ticketNumber;
  });
  
  return transaction();
}

export function getTicket(channelId: string): { userId: string; ticketNumber: number } | null {
  const stmt = db.prepare('SELECT userId, ticketNumber FROM tickets WHERE channelId = ?');
  const row = stmt.get(channelId) as { userId: string; ticketNumber: number } | undefined;
  return row ?? null;
}

export function deleteTicket(channelId: string): void {
  db.prepare('DELETE FROM tickets WHERE channelId = ?').run(channelId);
}

export function hasActiveTicket(guildId: string, userId: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM tickets WHERE guildId = ? AND userId = ? LIMIT 1');
  return !!stmt.get(guildId, userId);
}
