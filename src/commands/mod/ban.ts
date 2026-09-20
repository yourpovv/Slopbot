import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, bannedEmbed } from '../../services/embeds';
import { isProtected } from '../../services/permissions';

const DELETE_MSG_SECONDS = 86_400;

const cmd: Command = {
  name: 'ban',
  aliases: ['b'],
  description: 'ban a member',
  cooldown: 0,
  permissions: [PermissionFlagsBits.BanMembers],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ban a member')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why')),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const reason = i.options.getString('reason') ?? 'no reason';
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });
    if (isProtected(target)) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'cannot ban protected members (owner/admin)')], flags: MessageFlags.Ephemeral });
    await execute(target, reason);
    const { embed, file } = bannedEmbed(i.guildId!, target.user.tag, reason);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    if (isProtected(target)) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'cannot ban protected members (owner/admin)')] });
    const reason = args.slice(1).join(' ') || 'no reason';
    await execute(target, reason);
    const { embed, file } = bannedEmbed(msg.guildId!, target.user.tag, reason);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

async function execute(target: GuildMember, reason: string): Promise<void> {
  await target.ban({ reason, deleteMessageSeconds: DELETE_MSG_SECONDS });
}

export default cmd;
