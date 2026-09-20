import db from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS leveling_config (
    guildId TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    announceChannelId TEXT,
    dmEnabled INTEGER DEFAULT 0,
    xpMultiplier REAL DEFAULT 1.0,
    xpPerMessage INTEGER DEFAULT 15,
    cooldownSeconds INTEGER DEFAULT 60
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS level_rewards (
    guildId TEXT NOT NULL,
    level INTEGER NOT NULL,
    roleId TEXT NOT NULL,
    PRIMARY KEY (guildId, level)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_levels (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    messagesSent INTEGER DEFAULT 0,
    lastXpTime INTEGER DEFAULT 0,
    PRIMARY KEY (guildId, userId)
  )
`);

export interface LevelingConfig {
  guildId: string;
  enabled: boolean;
  announceChannelId: string | null;
  dmEnabled: boolean;
  xpMultiplier: number;
  xpPerMessage: number;
  cooldownSeconds: number;
}

export interface UserLevel {
  guildId: string;
  userId: string;
  xp: number;
  level: number;
  messagesSent: number;
  lastXpTime: number;
}

export function getLevelingConfig(guildId: string): LevelingConfig {
  const stmt = db.prepare('SELECT * FROM leveling_config WHERE guildId = ?');
  const row = stmt.get(guildId) as any;
  
  if (!row) {
    return {
      guildId,
      enabled: true,
      announceChannelId: null,
      dmEnabled: false,
      xpMultiplier: 1.0,
      xpPerMessage: 15,
      cooldownSeconds: 60,
    };
  }
  
  return {
    guildId: row.guildId,
    enabled: row.enabled === 1,
    announceChannelId: row.announceChannelId,
    dmEnabled: row.dmEnabled === 1,
    xpMultiplier: row.xpMultiplier,
    xpPerMessage: row.xpPerMessage,
    cooldownSeconds: row.cooldownSeconds,
  };
}

export function enableLeveling(guildId: string, enabled: boolean): void {
  db.prepare(`
    INSERT INTO leveling_config (guildId, enabled)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET enabled = ?
  `).run(guildId, enabled ? 1 : 0, enabled ? 1 : 0);
}

export function setAnnounceChannel(guildId: string, channelId: string | null): void {
  db.prepare(`
    INSERT INTO leveling_config (guildId, announceChannelId)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET announceChannelId = ?
  `).run(guildId, channelId, channelId);
}

export function setDmEnabled(guildId: string, enabled: boolean): void {
  db.prepare(`
    INSERT INTO leveling_config (guildId, dmEnabled)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET dmEnabled = ?
  `).run(guildId, enabled ? 1 : 0, enabled ? 1 : 0);
}

export function setXpMultiplier(guildId: string, multiplier: number): void {
  db.prepare(`
    INSERT INTO leveling_config (guildId, xpMultiplier)
    VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET xpMultiplier = ?
  `).run(guildId, multiplier, multiplier);
}

export function addLevelReward(guildId: string, level: number, roleId: string): void {
  db.prepare(`
    INSERT INTO level_rewards (guildId, level, roleId)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, level) DO UPDATE SET roleId = ?
  `).run(guildId, level, roleId, roleId);
}

export function removeLevelReward(guildId: string, level: number): void {
  db.prepare('DELETE FROM level_rewards WHERE guildId = ? AND level = ?').run(guildId, level);
}

export function getLevelRewards(guildId: string): Record<number, string> {
  const stmt = db.prepare('SELECT level, roleId FROM level_rewards WHERE guildId = ? ORDER BY level ASC');
  const rows = stmt.all(guildId) as { level: number; roleId: string }[];
  const result: Record<number, string> = {};
  for (const row of rows) {
    result[row.level] = row.roleId;
  }
  return result;
}

export function getUserLevel(guildId: string, userId: string): UserLevel {
  const stmt = db.prepare('SELECT * FROM user_levels WHERE guildId = ? AND userId = ?');
  const row = stmt.get(guildId, userId) as any;
  
  if (!row) {
    return {
      guildId,
      userId,
      xp: 0,
      level: 0,
      messagesSent: 0,
      lastXpTime: 0,
    };
  }
  
  return {
    guildId: row.guildId,
    userId: row.userId,
    xp: row.xp,
    level: row.level,
    messagesSent: row.messagesSent,
    lastXpTime: row.lastXpTime,
  };
}

export function addXp(guildId: string, userId: string, xp: number): { leveled: boolean; newLevel: number } {
  const user = getUserLevel(guildId, userId);
  const newXp = user.xp + xp;
  const oldLevel = user.level;
  const newLevel = calculateLevel(newXp);
  
  db.prepare(`
    INSERT INTO user_levels (guildId, userId, xp, level, messagesSent, lastXpTime)
    VALUES (?, ?, ?, ?, 1, strftime('%s', 'now'))
    ON CONFLICT(guildId, userId) DO UPDATE SET
      xp = ?,
      level = ?,
      messagesSent = messagesSent + 1,
      lastXpTime = strftime('%s', 'now')
  `).run(guildId, userId, newXp, newLevel, newXp, newLevel);
  
  return {
    leveled: newLevel > oldLevel,
    newLevel,
  };
}

export function setUserXp(guildId: string, userId: string, xp: number): void {
  const level = calculateLevel(xp);
  
  db.prepare(`
    INSERT INTO user_levels (guildId, userId, xp, level, messagesSent)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(guildId, userId) DO UPDATE SET xp = ?, level = ?
  `).run(guildId, userId, xp, level, xp, level);
}

export function resetUserXp(guildId: string, userId: string): void {
  db.prepare('DELETE FROM user_levels WHERE guildId = ? AND userId = ?').run(guildId, userId);
}

export function getLeaderboard(guildId: string, limit: number = 10, offset: number = 0): UserLevel[] {
  const stmt = db.prepare('SELECT * FROM user_levels WHERE guildId = ? ORDER BY xp DESC LIMIT ? OFFSET ?');
  const rows = stmt.all(guildId, limit, offset) as any[];
  
  return rows.map(row => ({
    guildId: row.guildId,
    userId: row.userId,
    xp: row.xp,
    level: row.level,
    messagesSent: row.messagesSent,
    lastXpTime: row.lastXpTime,
  }));
}

export function canGainXp(guildId: string, userId: string, config: LevelingConfig): boolean {
  const user = getUserLevel(guildId, userId);
  const now = Math.floor(Date.now() / 1000);
  return (now - user.lastXpTime) >= config.cooldownSeconds;
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpToNextLevel(xp: number): number {
  const currentLevel = calculateLevel(xp);
  return xpForLevel(currentLevel + 1) - xp;
}
