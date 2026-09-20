import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, kickedEmbed } from '../../services/embeds';
import { isProtected } from '../../services/permissions';

const cmd: Command = {
  name: 'kick',
  aliases: ['k'],
  description: 'kick a member',
  cooldown: 0,
  permissions: [PermissionFlagsBits.KickMembers],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('kick a member')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why')),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const reason = i.options.getString('reason') ?? 'no reason';
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });
    if (isProtected(target)) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'cannot kick protected members (owner/admin)')], flags: MessageFlags.Ephemeral });
    await target.kick(reason);
    const { embed, file } = kickedEmbed(i.guildId!, target.user.tag, reason);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    if (isProtected(target)) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'cannot kick protected members (owner/admin)')] });
    const reason = args.slice(1).join(' ') || 'no reason';
    await target.kick(reason);
    const { embed, file } = kickedEmbed(msg.guildId!, target.user.tag, reason);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

export default cmd;
