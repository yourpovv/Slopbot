import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS role_panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    maxSelections INTEGER DEFAULT 0,
    requiredRoleId TEXT,
    messageId TEXT,
    channelId TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS panel_roles (
    panelId INTEGER NOT NULL,
    roleId TEXT NOT NULL,
    emoji TEXT,
    label TEXT NOT NULL,
    buttonRow INTEGER DEFAULT 0,
    PRIMARY KEY (panelId, roleId),
    FOREIGN KEY(panelId) REFERENCES role_panels(id) ON DELETE CASCADE
  )
`);

export interface RolePanel {
  id: number;
  guildId: string;
  name: string;
  description: string | null;
  maxSelections: number;
  requiredRoleId: string | null;
  messageId: string | null;
  channelId: string | null;
}

export interface PanelRole {
  panelId: number;
  roleId: string;
  emoji: string | null;
  label: string;
  buttonRow: number;
}

export function createPanel(guildId: string, name: string): number {
  const result = db.prepare(`
    INSERT INTO role_panels (guildId, name)
    VALUES (?, ?)
  `).run(guildId, name);
  
  return result.lastInsertRowid as number;
}

export function getPanel(panelId: number, guildId: string): RolePanel | null {
  const stmt = db.prepare('SELECT * FROM role_panels WHERE id = ? AND guildId = ?');
  const row = stmt.get(panelId, guildId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    guildId: row.guildId,
    name: row.name,
    description: row.description,
    maxSelections: row.maxSelections,
    requiredRoleId: row.requiredRoleId,
    messageId: row.messageId,
    channelId: row.channelId,
  };
}

export function getPanelByMessage(messageId: string): RolePanel | null {
  const stmt = db.prepare('SELECT * FROM role_panels WHERE messageId = ?');
  const row = stmt.get(messageId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    guildId: row.guildId,
    name: row.name,
    description: row.description,
    maxSelections: row.maxSelections,
    requiredRoleId: row.requiredRoleId,
    messageId: row.messageId,
    channelId: row.channelId,
  };
}

export function getAllPanels(guildId: string): RolePanel[] {
  const stmt = db.prepare('SELECT * FROM role_panels WHERE guildId = ?');
  const rows = stmt.all(guildId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    guildId: row.guildId,
    name: row.name,
    description: row.description,
    maxSelections: row.maxSelections,
    requiredRoleId: row.requiredRoleId,
    messageId: row.messageId,
    channelId: row.channelId,
  }));
}

export function deletePanel(panelId: number, guildId: string): boolean {
  const result = db.prepare('DELETE FROM role_panels WHERE id = ? AND guildId = ?').run(panelId, guildId);
  return result.changes > 0;
}

export function setPanelDescription(panelId: number, description: string): void {
  db.prepare('UPDATE role_panels SET description = ? WHERE id = ?').run(description, panelId);
}

export function setPanelLimit(panelId: number, maxSelections: number): void {
  db.prepare('UPDATE role_panels SET maxSelections = ? WHERE id = ?').run(maxSelections, panelId);
}

export function setPanelRequired(panelId: number, requiredRoleId: string | null): void {
  db.prepare('UPDATE role_panels SET requiredRoleId = ? WHERE id = ?').run(requiredRoleId, panelId);
}

export function setPanelMessage(panelId: number, messageId: string, channelId: string): void {
  db.prepare('UPDATE role_panels SET messageId = ?, channelId = ? WHERE id = ?').run(messageId, channelId, panelId);
}

export function addPanelRole(panelId: number, roleId: string, label: string, emoji?: string): void {
  const roles = getPanelRoles(panelId);
  const row = Math.floor(roles.length / 5);
  
  db.prepare(`
    INSERT INTO panel_roles (panelId, roleId, emoji, label, buttonRow)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(panelId, roleId) DO UPDATE SET emoji = ?, label = ?
  `).run(panelId, roleId, emoji ?? null, label, row, emoji ?? null, label);
}

export function removePanelRole(panelId: number, roleId: string): boolean {
  const result = db.prepare('DELETE FROM panel_roles WHERE panelId = ? AND roleId = ?').run(panelId, roleId);
  return result.changes > 0;
}

export function getPanelRoles(panelId: number): PanelRole[] {
  const stmt = db.prepare('SELECT * FROM panel_roles WHERE panelId = ? ORDER BY buttonRow, rowid');
  const rows = stmt.all(panelId) as any[];
  
  return rows.map(row => ({
    panelId: row.panelId,
    roleId: row.roleId,
    emoji: row.emoji,
    label: row.label,
    buttonRow: row.buttonRow,
  }));
}
