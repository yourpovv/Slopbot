import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS } from '../../config';
import { asset } from '../../services/embeds';
import { getBrand } from '../../data/brand';

const MIN_WAIT_MINUTES = 1;
const MAX_WAIT_MINUTES = 120;
const DEFAULT_WAIT_MINUTES = 10;
const MS_PER_MINUTE = 60_000;
const MAX_TITLE_LENGTH = 100;

const sessions = new Map<string, LfgSession>();

interface LfgSession {
  guildId: string;
  hostId: string;
  title: string;
  players: Set<string>;
  maxPlayers: number;
  endsAt: number;
  channel: TextChannel;
  messageId: string;
  timeout: ReturnType<typeof setTimeout>;
}

function lfgEmbed(guildId: string, title: string, hostId: string, players: Set<string>, max: number, endsAt: number): EmbedBuilder {
  const list = players.size > 0
    ? [...players].map(id => `  <@${id}>`).join('\n')
    : '  *no one yet - be the first!*';

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`🎮 LFG - ${title}`)
    .setDescription(
      `hosted by <@${hostId}>\n\n` +
      `**players** (${players.size}/${max})\n${list}\n\n` +
      `ends <t:${Math.floor(endsAt / 1_000)}:R>`
    )
    .setImage('attachment://LFG.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

function lfgButtons(full: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('lfg_join')
      .setLabel('join')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🙋')
      .setDisabled(full),
    new ButtonBuilder()
      .setCustomId('lfg_leave')
      .setLabel('leave')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👋'),
    new ButtonBuilder()
      .setCustomId('lfg_cancel')
      .setLabel('cancel')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('✖'),
  );
}

function summaryEmbed(guildId: string, title: string, players: Set<string>, cancelled: boolean): EmbedBuilder {
  if (cancelled) {
    return new EmbedBuilder()
      .setColor(COLORS.error)
      .setTitle(`🎮 LFG - ${title}`)
      .setDescription('*cancelled by host*')
      .setFooter({ text: getBrand(guildId) })
      .setTimestamp();
  }

  const mentions = players.size > 0
    ? [...players].map(id => `<@${id}>`).join(' ')
    : 'nobody joined 😔';

  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(`🎮 LFG - ${title}`)
    .setDescription(`**time's up - party formed!**\n\n${mentions}`)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

async function startLfg(
  channel: TextChannel,
  guildId: string,
  hostId: string,
  title: string,
  minutes: number,
  maxPlayers: number,
): Promise<void> {
  const endsAt = Date.now() + minutes * MS_PER_MINUTE;
  const players = new Set<string>([hostId]);

  const file = asset('LFG.png');
  const embed = lfgEmbed(guildId, title, hostId, players, maxPlayers, endsAt);
  const row = lfgButtons(players.size >= maxPlayers);
  const msg = await channel.send({ embeds: [embed], components: [row], files: [file] });

  const timeout = setTimeout(() => endSession(msg.id), minutes * MS_PER_MINUTE);

  sessions.set(msg.id, { guildId, hostId, title, players, maxPlayers, endsAt, channel, messageId: msg.id, timeout });
}

async function endSession(msgId: string): Promise<void> {
  const session = sessions.get(msgId);
  if (!session) return;
  sessions.delete(msgId);
  clearTimeout(session.timeout);

  try {
    const msg = await session.channel.messages.fetch(msgId);
    const embed = summaryEmbed(session.guildId, session.title, session.players, false);
    await msg.edit({ embeds: [embed], components: [] });

    if (session.players.size > 0) {
      const pings = [...session.players].map(id => `<@${id}>`).join(' ');
      await session.channel.send(`🎮 **${session.title}** is ready! ${pings}`);
    }
  } catch { }
}

export function lfgButton(
  customId: string,
  userId: string,
  msgId: string,
): { embed?: EmbedBuilder; row?: ActionRowBuilder<ButtonBuilder>; reply?: { style: 'success' | 'error' | 'warn'; text: string }; end?: EmbedBuilder } | null {
  const session = sessions.get(msgId);
  if (!session) return { reply: { style: 'error', text: 'this lfg session has ended' } };

  if (customId === 'lfg_join') {
    if (session.players.has(userId)) return { reply: { style: 'warn', text: 'you already joined' } };
    if (session.players.size >= session.maxPlayers) return { reply: { style: 'error', text: 'party is full' } };
    session.players.add(userId);
    const full = session.players.size >= session.maxPlayers;
    return {
      embed: lfgEmbed(session.guildId, session.title, session.hostId, session.players, session.maxPlayers, session.endsAt),
      row: lfgButtons(full),
      reply: { style: 'success', text: '✅ you joined the party' },
    };
  }

  if (customId === 'lfg_leave') {
    if (!session.players.has(userId)) return { reply: { style: 'warn', text: "you're not in this party" } };
    if (userId === session.hostId) return { reply: { style: 'error', text: 'hosts can\'t leave - use cancel instead' } };
    session.players.delete(userId);
    return {
      embed: lfgEmbed(session.guildId, session.title, session.hostId, session.players, session.maxPlayers, session.endsAt),
      row: lfgButtons(false),
      reply: { style: 'success', text: '👋 you left the party' },
    };
  }

  if (customId === 'lfg_cancel') {
    if (userId !== session.hostId) return { reply: { style: 'error', text: 'only the host can cancel' } };
    clearTimeout(session.timeout);
    sessions.delete(msgId);
    return { end: summaryEmbed(session.guildId, session.title, session.players, true) };
  }

  return null;
}

const cmd: Command = {
  name: 'lfg',
  aliases: ['lookingforgroup', 'party'],
  description: 'start a looking-for-group party',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('lfg')
    .setDescription('start a looking-for-group party')
    .addStringOption(o =>
      o.setName('game').setDescription('what are you playing?').setRequired(true).setMaxLength(MAX_TITLE_LENGTH))
    .addIntegerOption(o =>
      o.setName('max').setDescription('max players (default 5)').setMinValue(2).setMaxValue(20))
    .addIntegerOption(o =>
      o.setName('minutes').setDescription(`wait time in minutes (default ${DEFAULT_WAIT_MINUTES})`).setMinValue(MIN_WAIT_MINUTES).setMaxValue(MAX_WAIT_MINUTES)),

  async run(i: ChatInputCommandInteraction) {
    const game = i.options.getString('game', true);
    const max = i.options.getInteger('max') ?? 5;
    const minutes = i.options.getInteger('minutes') ?? DEFAULT_WAIT_MINUTES;
    const channel = i.channel as TextChannel;

    await startLfg(channel, i.guildId!, i.user.id, game, minutes, max);
    await i.reply({ content: '🎮 lfg created!', flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message, args: string[]) {
    if (!args.length) return void await msg.reply('usage: `.lfg <game> [max] [minutes]`');

    const parts = args.join(' ').split('|').map(s => s.trim());
    const game = parts[0];
    const max = parseInt(parts[1]) || 5;
    const minutes = parseInt(parts[2]) || DEFAULT_WAIT_MINUTES;

    if (!game) return void await msg.reply('give a game name');
    await startLfg(msg.channel as TextChannel, msg.guildId!, msg.author.id, game, minutes, max);
  },
};

export default cmd;
