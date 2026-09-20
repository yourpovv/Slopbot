import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, warnedEmbed } from '../../services/embeds';
import * as warns from '../../data/warns';
import { isProtected } from '../../services/permissions';

const cmd: Command = {
  name: 'warn',
  aliases: ['w'],
  description: 'warn a member',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ModerateMembers],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('warn a member')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const reason = i.options.getString('reason', true);
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });
    if (isProtected(target)) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'cannot warn protected members (owner/admin)')], flags: MessageFlags.Ephemeral });

    warns.add(i.guildId!, target.id, reason, i.user.id);
    const total = warns.count(i.guildId!, target.id);
    const { embed, file } = warnedEmbed(i.guildId!, target.user.tag, reason, total);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    if (isProtected(target)) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'cannot warn protected members (owner/admin)')] });

    const reason = args.slice(1).join(' ');
    if (!reason) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'provide a reason')] });

    warns.add(msg.guildId!, target.id, reason, msg.author.id);
    const total = warns.count(msg.guildId!, target.id);
    const { embed, file } = warnedEmbed(msg.guildId!, target.user.tag, reason, total);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

export default cmd;
