import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { BRAND, COLORS } from '../config';
import { EmbedStyle } from '../types';
import { join } from 'path';
import { getBrand } from '../data/brand';

const ASSET_DIR = join(__dirname, '..', '..', 'assets');

const SHIP_HIGH = 70;
const SHIP_MID = 40;
const BAR_SEGMENTS = 10;

const styleColors: Record<EmbedStyle, number> = {
  default: COLORS.brand,
  success: COLORS.success,
  error: COLORS.error,
  warn: COLORS.warn,
  info: COLORS.info,
};

export function brandEmbed(guildId: string, style: EmbedStyle, desc: string): EmbedBuilder {
  const footer = guildId ? getBrand(guildId) : BRAND;
  return new EmbedBuilder()
    .setColor(styleColors[style])
    .setDescription(desc)
    .setFooter({ text: footer })
    .setTimestamp();
}

export function titled(guildId: string, style: EmbedStyle, title: string, desc: string): EmbedBuilder {
  return brandEmbed(guildId, style, desc).setTitle(title);
}

export function withImage(guildId: string, style: EmbedStyle, desc: string, imageUrl: string): EmbedBuilder {
  return brandEmbed(guildId, style, desc).setImage(imageUrl);
}

export function asset(name: string): AttachmentBuilder {
  return new AttachmentBuilder(join(ASSET_DIR, name), { name });
}

export function verifyEmbed(guildId: string): { embed: EmbedBuilder; row: ActionRowBuilder<ButtonBuilder>; files: AttachmentBuilder[] } {
  const verifyFile = asset('verify.png');
  const iconFile = asset('server_icon.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('verification')
    .setDescription('╰ press the button below to verify and gain access to the server')
    .setThumbnail('attachment://server_icon.png')
    .setImage('attachment://verify.png')
    .setFooter({ text: getBrand(guildId) });
  return { embed, row: verifyButton(), files: [verifyFile, iconFile] };
}

function verifyButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_btn')
      .setLabel('verify')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅')
  );
}

export function rulesEmbed(guildId: string, rules: string[]): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('rules.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('rules')
    .setDescription(formatRules(rules))
    .setImage('attachment://rules.png')
    .setFooter({ text: getBrand(guildId) });
  return { embed, file };
}

function formatRules(rules: string[]): string {
  return rules.map((r, i) => `\` ${i + 1} \` ${r}`).join('\n');
}

export function categorizedRolesMenu(guildId: string): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]; file: AttachmentBuilder } {
  const file = asset('roles.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('role selection')
    .setDescription('╰ use the buttons below to access different role categories')
    .setImage('attachment://roles.png')
    .setFooter({ text: getBrand(guildId) });
  
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_colors')
      .setLabel('colors')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎨'),
    new ButtonBuilder()
      .setCustomId('show_gender')
      .setLabel('gender')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('👤'),
    new ButtonBuilder()
      .setCustomId('show_age')
      .setLabel('age')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎂'),
    new ButtonBuilder()
      .setCustomId('show_others')
      .setLabel('others')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📌'),
  );
  
  return { embed, rows: [buttonRow], file };
}

export function colorRolesMenu(
  guildId: string,
  colorMap: Record<string, string>
): { embed: EmbedBuilder; row: ActionRowBuilder<StringSelectMenuBuilder>; file: AttachmentBuilder } {
  const file = asset('colors.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('color roles')
    .setDescription('╰ pick a color role from the dropdown')
    .setImage('attachment://colors.png')
    .setFooter({ text: getBrand(guildId) });
  
  const row = colorSelect(colorMap, 'pick a color');
  
  return { embed, row, file };
}

export function genderRolesMenu(
  guildId: string,
  roleIds: Record<string, string>,
  guild: any
): { embed: EmbedBuilder; row: ActionRowBuilder<StringSelectMenuBuilder>; file: AttachmentBuilder } {
  const file = asset('male_or_female.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('gender roles')
    .setDescription('╰ pick **one** gender/pronoun role from the dropdown')
    .setImage('attachment://male_or_female.png')
    .setFooter({ text: getBrand(guildId) });
  
  const row = buildRoleSelect(roleIds, guild, 'pick gender/pronouns', 'gender_role_select', 1);
  
  return { embed, row, file };
}

export function ageRolesMenu(
  guildId: string,
  roleIds: Record<string, string>,
  guild: any
): { embed: EmbedBuilder; row: ActionRowBuilder<StringSelectMenuBuilder>; file: AttachmentBuilder } {
  const file = asset('adult_or_minor.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('age roles')
    .setDescription('╰ pick **one** age role from the dropdown')
    .setImage('attachment://adult_or_minor.png')
    .setFooter({ text: getBrand(guildId) });
  
  const row = buildRoleSelect(roleIds, guild, 'pick age', 'age_role_select', 1);
  
  return { embed, row, file };
}

export function otherRolesMenu(
  guildId: string,
  extraMap: Record<string, string>
): { embed: EmbedBuilder; row: ActionRowBuilder<StringSelectMenuBuilder>; file: AttachmentBuilder } {
  const file = asset('others.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('other roles')
    .setDescription('╰ pick notification & ping roles from the dropdown')
    .setImage('attachment://others.png')
    .setFooter({ text: getBrand(guildId) });
  
  const row = alertsSelect(extraMap, 'pick alerts & notifications');
  
  return { embed, row, file };
}

function colorOptions(colorMap: Record<string, string>) {
  return Object.entries(colorMap)
    .filter(([_, id]) => id)
    .map(([name, id]) => ({ label: name, value: id, emoji: colorEmoji(name) }));
}

function colorSelect(colorMap: Record<string, string>, placeholder: string) {
  const options = colorOptions(colorMap);
  if (options.length === 0) {
    options.push({ label: 'no roles configured', value: 'none', emoji: '❌' });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('color_role_select')
      .setPlaceholder(placeholder)
      .setMinValues(0)
      .setMaxValues(1)
      .setDisabled(options[0].value === 'none')
      .addOptions(options)
  );
}

function alertsOptions(extraMap: Record<string, string>) {
  const labels: Record<string, { label: string; emoji: string }> = {
    pings: { label: 'pings', emoji: '🔔' },
    vcRevive: { label: 'vc revive', emoji: '🎙️' },
    chatRevive: { label: 'chat revive', emoji: '💬' },
    picPerms: { label: 'pic perms', emoji: '🖼️' },
  };
  
  return Object.entries(extraMap)
    .filter(([_, id]) => id)
    .map(([key, id]) => ({
      label: labels[key]?.label || key,
      value: id,
      emoji: labels[key]?.emoji || '📌',
    }));
}

function alertsSelect(extraMap: Record<string, string>, placeholder: string) {
  const options = alertsOptions(extraMap);
  if (options.length === 0) {
    options.push({ label: 'no roles configured', value: 'none', emoji: '❌' });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('alerts_role_select')
      .setPlaceholder(placeholder)
      .setMinValues(0)
      .setMaxValues(Math.min(4, options.length))
      .setDisabled(options[0].value === 'none')
      .addOptions(options)
  );
}

function buildRoleSelect(roleIds: Record<string, string>, guild: any, placeholder: string, customId: string, maxValues: number = 25) {
  const options = Object.values(roleIds)
    .filter(id => id)
    .map(id => {
      const role = guild.roles.cache.get(id);
      return role ? { label: role.name, value: id, emoji: '👤' } : null;
    })
    .filter((opt): opt is { label: string; value: string; emoji: string } => opt !== null);
  
  if (options.length === 0) {
    options.push({ label: 'no roles configured', value: 'none', emoji: '❌' });
  }
  
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(0)
      .setMaxValues(Math.min(options.length, maxValues))
      .setDisabled(options[0].value === 'none')
      .addOptions(options)
  );
}

function colorEmoji(name: string): string {
  const map: Record<string, string> = {
    red: '🔴', orange: '🟠', yellow: '🟡', green: '🟢',
    blue: '🔵', purple: '🟣', pink: '💗', white: '⚪', black: '⚫',
  };
  return map[name] ?? '🎨';
}

export function shipEmbed(guildId: string, u1: string, u2: string, pct: number): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const bar = progressBar(pct);
  const file = asset('ship.png');
  const embed = new EmbedBuilder()
    .setColor(pct > SHIP_HIGH ? COLORS.success : pct > SHIP_MID ? COLORS.warn : COLORS.error)
    .setTitle('💘 ship')
    .setDescription(`${u1} **x** ${u2}\n\n${bar} **${pct}%**`)
    .setImage('attachment://ship.png')
    .setFooter({ text: getBrand(guildId) });
  return { embed, file };
}

export function uwuifyEmbed(guildId: string, text: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('uwuify!')
    .setDescription(text)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

export function repLeaderboardEmbed(guildId: string, desc: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('top_rep.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('⭐ rep leaderboard')
    .setDescription(desc)
    .setImage('attachment://top_rep.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function ticketPanelEmbed(guildId: string, title: string, body: string): { embed: EmbedBuilder; row: ActionRowBuilder<ButtonBuilder>; file: AttachmentBuilder } {
  const file = asset('tickets.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.pastel)
    .setTitle(title)
    .setDescription(body)
    .setImage('attachment://tickets.png')
    .setFooter({ text: getBrand(guildId) });
  return { embed, row: ticketButton(), file };
}

function ticketButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫')
  );
}

export function ticketCloseButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );
}

function progressBar(pct: number): string {
  const filled = Math.round(pct / BAR_SEGMENTS);
  return '▰'.repeat(filled) + '▱'.repeat(BAR_SEGMENTS - filled);
}

export function bannedEmbed(guildId: string, userTag: string, reason: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('banned.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.error)
    .setDescription(`banned **${userTag}** - ${reason}`)
    .setImage('attachment://banned.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function kickedEmbed(guildId: string, userTag: string, reason: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('kicked.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.warn)
    .setDescription(`kicked **${userTag}** - ${reason}`)
    .setImage('attachment://kicked.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function mutedEmbed(guildId: string, userTag: string, duration: string, reason: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('muted.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.warn)
    .setDescription(`muted **${userTag}** for **${duration}** - ${reason}`)
    .setImage('attachment://muted.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function warnedEmbed(guildId: string, userTag: string, reason: string, total: number): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('warned.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.warn)
    .setDescription(`warned **${userTag}** - ${reason}\ntotal warnings: **${total}**`)
    .setImage('attachment://warned.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function fakeModEmbed(guildId: string, desc: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('it was a joke.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setDescription(desc)
    .setImage('attachment://it was a joke.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function blockedEmbed(guildId: string, targetMention: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('blocked.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`blocked ${targetMention}`)
    .setImage('attachment://blocked.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function unblockedEmbed(guildId: string, targetMention: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('unblocked.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`unblocked ${targetMention}`)
    .setImage('attachment://unblocked.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function blocklistEmbed(guildId: string, ids: string[]): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('block_list.png');
  const list = ids.length === 0 ? 'no one is blocked' : ids.map(id => `• <@${id}>`).join('\n');
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`🚫 blocked (${ids.length})`)
    .setDescription(list)
    .setImage('attachment://block_list.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function nerdifiedEmbed(guildId: string, targetMention: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`🤓 now nerdifying ${targetMention}'s messages`)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

export function unnerdifiedEmbed(guildId: string, targetMention: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`stopped nerdifying ${targetMention}'s messages`)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

export function nerdifylistEmbed(guildId: string, ids: string[]): EmbedBuilder {
  const list = ids.length === 0 ? 'no one is being nerdified' : ids.map(id => `• <@${id}>`).join('\n');
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`🤓 nerdified users (${ids.length})`)
    .setDescription(list)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

export function nerdifyEmbed(guildId: string, text: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('🤓 nerdified')
    .setDescription(text)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

export function pollEmbed(guildId: string, question: string, author: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('poll.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle('📊 poll')
    .setDescription(`${question}\n\n✅ - yes\n❌ - no\n\nasked by ${author}`)
    .setImage('attachment://poll.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

export function simpEmbed(guildId: string, user: string, target: string, pct: number): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('simp.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('💗 simp meter')
    .setDescription(`${user} is **${pct}%** simp for ${target}`)
    .setImage('attachment://simp.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}
