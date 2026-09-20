import {
  ChatInputCommandInteraction,
  Message,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  cooldown: number;
  permissions: PermissionResolvable[];
  staffOnly: boolean;
  slash: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  run: (interaction: ChatInputCommandInteraction) => Promise<void>;
  prefix: (msg: Message, args: string[]) => Promise<void>;
}

export interface EventFile {
  name: string;
  once: boolean;
  run: (...args: unknown[]) => Promise<void>;
}

export type EmbedStyle = 'default' | 'success' | 'error' | 'warn' | 'info';

export interface BlockEntry {
  guildId: string;
  userId: string;
  blockedId: string;
}

export interface WarnEntry {
  id: number;
  guildId: string;
  userId: string;
  reason: string;
  modId: string;
  timestamp: number;
}
