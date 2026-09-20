import { GuildMember, PermissionResolvable, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';
import * as guildConfig from '../data/guildconfig';

export function hasPerms(member: GuildMember | null, cmd: Command): boolean {
  if (!cmd.staffOnly && cmd.permissions.length === 0) return true;
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (isStaff(member)) return true;
  if (cmd.staffOnly) return false;
  return hasAll(member, cmd.permissions);
}

export function isStaff(member: GuildMember): boolean {
  const config = guildConfig.getGuildConfig(member.guild.id);
  const staffIds = [config.ownerRole, config.adminRole, config.modRole, config.staffRole];
  return staffIds.some(id => id && member.roles.cache.has(id));
}

export function isAdmin(member: GuildMember): boolean {
  const config = guildConfig.getGuildConfig(member.guild.id);
  const adminIds = [config.ownerRole, config.adminRole];
  return adminIds.some(id => id && member.roles.cache.has(id));
}

export function isOwner(member: GuildMember): boolean {
  const config = guildConfig.getGuildConfig(member.guild.id);
  if (member.guild.ownerId === member.id) return true;
  return config.ownerRole ? member.roles.cache.has(config.ownerRole) : false;
}

export function isProtected(member: GuildMember): boolean {
  return isAdmin(member);
}

function hasAll(member: GuildMember, perms: PermissionResolvable[]): boolean {
  if (perms.length === 0) return true;
  return perms.every(p => member.permissions.has(p));
}
