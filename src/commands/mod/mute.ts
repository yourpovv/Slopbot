import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, mutedEmbed } from '../../services/embeds';
import { isProtected } from '../../services/permissions';

const MUTE_DURATIONS: Record<string, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '10m': 600_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '6h': 21_600_000,
  '1d': 86_400_000,
  '7d': 604_800_000,
};

const cmd: Command = {
  name: 'mute',
  aliases: ['timeout', 'stfu'],
  description: 'timeout a member',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ModerateMembers],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('timeout a member')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o =>
      o.setName('duration').setDescription('how long (1m, 5m, 10m, 30m, 1h, 6h, 1d, 7d)').setRequired(true)
    )
    .addStringOption(o => o.setName('reason').setDescription('why')),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const dur = i.options.getString('duration', true);
    const reason = i.options.getString('reason') ?? 'no reason';
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });
    if (isProtected(target)) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'cannot mute protected members (owner/admin)')], flags: MessageFlags.Ephemeral });
    const ms = parseDuration(dur);
    if (!ms) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'invalid duration')], flags: MessageFlags.Ephemeral });
    await target.timeout(ms, reason);
    const { embed, file } = mutedEmbed(i.guildId!, target.user.tag, dur, reason);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    if (isProtected(target)) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'cannot mute protected members (owner/admin)')] });
    const dur = args[1];
    const ms = parseDuration(dur);
    if (!ms) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'usage: .mute @user 1h [reason]')] });
    const reason = args.slice(2).join(' ') || 'no reason';
    await target.timeout(ms, reason);
    const { embed, file } = mutedEmbed(msg.guildId!, target.user.tag, dur, reason);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

function parseDuration(input: string): number | null {
  if (!input) return null;
  return MUTE_DURATIONS[input.toLowerCase()] ?? null;
}

export default cmd;