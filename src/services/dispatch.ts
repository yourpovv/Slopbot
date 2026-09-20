import {
  ChatInputCommandInteraction,
  Message,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { PREFIX } from '../config';
import { hasPerms } from './permissions';
import { brandEmbed } from './embeds';
import { get } from './registry';
import { EmbedStyle } from '../types';

export async function onInteraction(i: ChatInputCommandInteraction): Promise<void> {
  const cmd = get(i.commandName);
  if (!cmd) return;
  
  const member = i.member as GuildMember;
  if (!hasPerms(member, cmd)) {
    if (cmd.staffOnly) {
      return denySlash(i, 'error', 'requires staff role - use `/setup roles` to configure roles or have server administrator permission');
    }
    const missing = cmd.permissions.filter(p => !member.permissions.has(p));
    return denySlash(i, 'error', `missing permission: ${missing.map(p => p.toString()).join(', ')}`);
  }

  try {
    await cmd.run(i);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error(`[cmd:${cmd.name}]`, msg);
    const opts = { embeds: [brandEmbed(i.guildId!, 'error', `something broke: ${msg}`)], flags: MessageFlags.Ephemeral } as const;
    if (i.replied || i.deferred) await i.followUp(opts).catch(() => {});
    else await i.reply(opts).catch(() => {});
  }
}

export async function onPrefix(msg: Message): Promise<void> {
  if (msg.author.bot) return;
  const parsed = parsePrefix(msg);
  if (!parsed) return;
  const cmd = get(parsed.name);
  if (!cmd) return;
  
  if (!hasPerms(msg.member, cmd)) {
    if (cmd.staffOnly) {
      return denyPrefix(msg, 'error', 'requires staff role - use `/setup roles` to configure roles or have server administrator permission');
    }
    const member = msg.member as GuildMember;
    const missing = cmd.permissions.filter(p => !member.permissions.has(p));
    return denyPrefix(msg, 'error', `missing permission: ${missing.map(p => p.toString()).join(', ')}`);
  }

  try {
    await cmd.prefix(msg, parsed.args);
  } catch (err) {
    const text = err instanceof Error ? err.message : 'unknown error';
    console.error(`[cmd:${cmd.name}]`, text);
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', `something broke: ${text}`)] }).catch(() => {});
  }
}

function parsePrefix(msg: Message): { name: string; args: string[] } | null {
  if (!msg.content.startsWith(PREFIX)) return null;
  const [raw, ...args] = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const name = raw?.toLowerCase();
  return name ? { name, args } : null;
}

async function denySlash(i: ChatInputCommandInteraction, style: EmbedStyle, text: string): Promise<void> {
  await i.reply({ embeds: [brandEmbed(i.guildId!, style, text)], flags: MessageFlags.Ephemeral });
}

async function denyPrefix(msg: Message, style: EmbedStyle, text: string): Promise<void> {
  await msg.reply({ embeds: [brandEmbed(msg.guildId!, style, text)] });
}
