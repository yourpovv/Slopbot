import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS } from '../../config';
import { asset } from '../../services/embeds';
import { getBrand } from '../../data/brand';

const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60_000;
const MIN_DURATION = 1;
const MAX_DURATION = 1440;
const DEFAULT_DURATION = 5;
const MAX_WINNERS = 10;
const MAX_PRIZE_LENGTH = 100;

const giveaways = new Map<string, GiveawaySession>();

interface GiveawaySession {
  guildId: string;
  hostId: string;
  prize: string;
  winners: number;
  entries: Set<string>;
  endsAt: number;
  channel: TextChannel;
  timeout: ReturnType<typeof setTimeout>;
}

function giveawayEmbed(guildId: string, prize: string, hostId: string, entries: number, winners: number, endsAt: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.warn)
    .setTitle('🎉 giveaway')
    .setDescription(
      `**${prize}**\n\n` +
      `hosted by <@${hostId}>\n` +
      `winners: **${winners}**\n` +
      `entries: **${entries}**\n\n` +
      `ends <t:${Math.floor(endsAt / MS_PER_SECOND)}:R>`
    )
    .setImage('attachment://giveaways.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

function createGiveawayButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel('enter')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎉'),
    new ButtonBuilder()
      .setCustomId('giveaway_leave')
      .setLabel('leave')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👋'),
    new ButtonBuilder()
      .setCustomId('giveaway_cancel')
      .setLabel('cancel')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('✖'),
  );
}

function resultEmbed(guildId: string, prize: string, winnerIds: string[], cancelled: boolean): EmbedBuilder {
  if (cancelled) {
    return new EmbedBuilder()
      .setColor(COLORS.error)
      .setTitle('🎉 giveaway')
      .setDescription(`**${prize}**\n\n*cancelled by host*`)
      .setFooter({ text: getBrand(guildId) })
      .setTimestamp();
  }

  const winnersText = winnerIds.length > 0
    ? winnerIds.map(id => `<@${id}>`).join(', ')
    : '*no entries*';

  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle('🎉 giveaway ended')
    .setDescription(prize)
    .addFields({ name: '🏆 winners', value: winnersText, inline: false })
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
}

function pickWinners(entries: Set<string>, count: number): string[] {
  const pool = [...entries];
  const picked: string[] = [];
  const amount = Math.min(count, pool.length);

  for (let i = 0; i < amount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

async function endGiveaway(msgId: string): Promise<void> {
  const session = giveaways.get(msgId);
  if (!session) return;
  giveaways.delete(msgId);
  clearTimeout(session.timeout);

  const winners = pickWinners(session.entries, session.winners);

  try {
    const msg = await session.channel.messages.fetch(msgId);
    const embed = resultEmbed(session.guildId, session.prize, winners, false);
    await msg.edit({ embeds: [embed], components: [] });

    if (winners.length > 0) {
      const pings = winners.map(id => `<@${id}>`).join(' ');
      await session.channel.send(`🎉 congrats ${pings} - you won **${session.prize}**!`);
    }
  } catch { }
}

async function startGiveaway(
  channel: TextChannel,
  guildId: string,
  hostId: string,
  prize: string,
  minutes: number,
  winners: number,
): Promise<void> {
  const endsAt = Date.now() + minutes * MS_PER_MINUTE;
  const entries = new Set<string>();

  const file = asset('giveaways.png');
  const embed = giveawayEmbed(guildId, prize, hostId, 0, winners, endsAt);
  const row = createGiveawayButton();
  const msg = await channel.send({ embeds: [embed], components: [row], files: [file] });

  const timeout = setTimeout(() => endGiveaway(msg.id), minutes * MS_PER_MINUTE);
  giveaways.set(msg.id, { guildId, hostId, prize, winners, entries, endsAt, channel, timeout });
}

export function giveawayButton(
  customId: string,
  userId: string,
  msgId: string,
): { embed?: EmbedBuilder; row?: ActionRowBuilder<ButtonBuilder>; reply?: { style: 'success' | 'error' | 'warn'; text: string }; end?: EmbedBuilder } | null {
  const session = giveaways.get(msgId);
  if (!session) return { reply: { style: 'error', text: 'this giveaway has ended' } };

  if (customId === 'giveaway_enter') {
    if (session.entries.has(userId)) return { reply: { style: 'warn', text: 'you already entered' } };
    session.entries.add(userId);
    return {
      embed: giveawayEmbed(session.guildId, session.prize, session.hostId, session.entries.size, session.winners, session.endsAt),
      row: createGiveawayButton(),
      reply: { style: 'success', text: '🎉 you entered the giveaway!' },
    };
  }

  if (customId === 'giveaway_leave') {
    if (!session.entries.has(userId)) return { reply: { style: 'warn', text: "you haven't entered" } };
    session.entries.delete(userId);
    return {
      embed: giveawayEmbed(session.guildId, session.prize, session.hostId, session.entries.size, session.winners, session.endsAt),
      row: createGiveawayButton(),
      reply: { style: 'success', text: '👋 you left the giveaway' },
    };
  }

  if (customId === 'giveaway_cancel') {
    if (userId !== session.hostId) return { reply: { style: 'error', text: 'only the host can cancel' } };
    clearTimeout(session.timeout);
    giveaways.delete(msgId);
    return { end: resultEmbed(session.guildId, session.prize, [], true) };
  }

  return null;
}

const cmd: Command = {
  name: 'giveaway',
  aliases: ['gw', 'gstart'],
  description: 'start a giveaway',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ManageMessages],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('start a giveaway')
    .addStringOption(o =>
      o.setName('prize').setDescription('what are you giving away?').setRequired(true).setMaxLength(MAX_PRIZE_LENGTH))
    .addIntegerOption(o =>
      o.setName('winners').setDescription('number of winners (default 1)').setMinValue(1).setMaxValue(MAX_WINNERS))
    .addIntegerOption(o =>
      o.setName('minutes').setDescription(`duration in minutes (default ${DEFAULT_DURATION})`).setMinValue(MIN_DURATION).setMaxValue(MAX_DURATION)),

  async run(i: ChatInputCommandInteraction) {
    const prize = i.options.getString('prize', true);
    const winners = i.options.getInteger('winners') ?? 1;
    const minutes = i.options.getInteger('minutes') ?? DEFAULT_DURATION;
    const channel = i.channel as TextChannel;

    await startGiveaway(channel, i.guildId!, i.user.id, prize, minutes, winners);
    await i.reply({ content: '🎉 giveaway created!', flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message, args: string[]) {
    if (!args.length) return void await msg.reply('usage: `.giveaway <prize> | [winners] | [minutes]`');

    const parts = args.join(' ').split('|').map(s => s.trim());
    const prize = parts[0];
    const winners = parseInt(parts[1]) || 1;
    const minutes = parseInt(parts[2]) || DEFAULT_DURATION;

    if (!prize) return void await msg.reply('give a prize name');
    await startGiveaway(msg.channel as TextChannel, msg.guildId!, msg.author.id, prize, minutes, winners);
  },
};

export default cmd;
