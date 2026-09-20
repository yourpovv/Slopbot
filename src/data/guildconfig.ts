import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_config (
    guildId TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '.',
    ownerRole TEXT,
    adminRole TEXT,
    modRole TEXT,
    staffRole TEXT,
    ticketCategory TEXT,
    ticketMode TEXT DEFAULT 'channel'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS color_roles (
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    roleId TEXT NOT NULL,
    PRIMARY KEY (guildId, name)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS identity_roles (
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    roleId TEXT NOT NULL,
    category TEXT NOT NULL,
    PRIMARY KEY (guildId, name)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS extra_roles (
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    roleId TEXT NOT NULL,
    PRIMARY KEY (guildId, name)
  )
`);

export interface GuildConfig {
  guildId: string;
  prefix: string;
  ownerRole: string | null;
  adminRole: string | null;
  modRole: string | null;
  staffRole: string | null;
  ticketCategory: string | null;
  ticketMode: 'channel' | 'thread';
}

export function getGuildConfig(guildId: string): GuildConfig {
  const stmt = db.prepare('SELECT * FROM guild_config WHERE guildId = ?');
  const row = stmt.get(guildId) as GuildConfig | undefined;
  
  if (!row) {
    return {
      guildId,
      prefix: '.',
      ownerRole: null,
      adminRole: null,
      modRole: null,
      staffRole: null,
      ticketCategory: null,
      ticketMode: 'channel',
    };
  }
  
  return row;
}

export function setPrefix(guildId: string, prefix: string): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, prefix)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET prefix = ?
  `).run(guildId, prefix, prefix);
}

export function setOwnerRole(guildId: string, roleId: string | null): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, ownerRole)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET ownerRole = ?
  `).run(guildId, roleId, roleId);
}

export function setAdminRole(guildId: string, roleId: string | null): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, adminRole)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET adminRole = ?
  `).run(guildId, roleId, roleId);
}

export function setModRole(guildId: string, roleId: string | null): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, modRole)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET modRole = ?
  `).run(guildId, roleId, roleId);
}

export function setStaffRole(guildId: string, roleId: string | null): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, staffRole)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET staffRole = ?
  `).run(guildId, roleId, roleId);
}

export function setTicketCategory(guildId: string, categoryId: string | null): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, ticketCategory)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET ticketCategory = ?
  `).run(guildId, categoryId, categoryId);
}

export function setTicketMode(guildId: string, mode: 'channel' | 'thread'): void {
  db.prepare(`
    INSERT INTO guild_config (guildId, ticketMode)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET ticketMode = ?
  `).run(guildId, mode, mode);
}

export function setColorRole(guildId: string, name: string, roleId: string): void {
  db.prepare(`
    INSERT INTO color_roles (guildId, name, roleId)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, name) DO UPDATE SET roleId = ?
  `).run(guildId, name, roleId, roleId);
}

export function deleteColorRole(guildId: string, name: string): void {
  db.prepare('DELETE FROM color_roles WHERE guildId = ? AND name = ?').run(guildId, name);
}

export function getColorRoles(guildId: string): Record<string, string> {
  const stmt = db.prepare('SELECT name, roleId FROM color_roles WHERE guildId = ?');
  const rows = stmt.all(guildId) as { name: string; roleId: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.name] = row.roleId;
  }
  return result;
}

// identity roles (male, female, him, her, adult, minor)
export function setIdentityRole(guildId: string, name: string, roleId: string, category: 'gender' | 'age'): void {
  db.prepare(`
    INSERT INTO identity_roles (guildId, name, roleId, category)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guildId, name) DO UPDATE SET roleId = ?, category = ?
  `).run(guildId, name, roleId, category, roleId, category);
}

export function deleteIdentityRole(guildId: string, name: string): void {
  db.prepare('DELETE FROM identity_roles WHERE guildId = ? AND name = ?').run(guildId, name);
}

export function deleteIdentityRoleByRoleId(guildId: string, roleId: string): void {
  db.prepare('DELETE FROM identity_roles WHERE guildId = ? AND roleId = ?').run(guildId, roleId);
}

export function getIdentityRoles(guildId: string): Record<string, string> {
  const stmt = db.prepare('SELECT name, roleId FROM identity_roles WHERE guildId = ?');
  const rows = stmt.all(guildId) as { name: string; roleId: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.name] = row.roleId;
  }
  return result;
}

export function getIdentityRolesWithCategory(guildId: string): Array<{ name: string; roleId: string; category: string }> {
  const stmt = db.prepare('SELECT name, roleId, category FROM identity_roles WHERE guildId = ?');
  return stmt.all(guildId) as Array<{ name: string; roleId: string; category: string }>;
}

export function getIdentityRolesByCategory(guildId: string, category: 'gender' | 'age'): Record<string, string> {
  const stmt = db.prepare('SELECT name, roleId FROM identity_roles WHERE guildId = ? AND category = ?');
  const rows = stmt.all(guildId, category) as { name: string; roleId: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.name] = row.roleId;
  }
  return result;
}

// extra/alert roles
export function setExtraRole(guildId: string, name: string, roleId: string): void {
  db.prepare(`
    INSERT INTO extra_roles (guildId, name, roleId)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, name) DO UPDATE SET roleId = ?
  `).run(guildId, name, roleId, roleId);
}

export function deleteExtraRole(guildId: string, name: string): void {
  db.prepare('DELETE FROM extra_roles WHERE guildId = ? AND name = ?').run(guildId, name);
}

export function getExtraRoles(guildId: string): Record<string, string> {
  const stmt = db.prepare('SELECT name, roleId FROM extra_roles WHERE guildId = ?');
  const rows = stmt.all(guildId) as { name: string; roleId: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.name] = row.roleId;
  }
  return result;
}
