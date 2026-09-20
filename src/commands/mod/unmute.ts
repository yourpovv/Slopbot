import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';

const cmd: Command = {
  name: 'unmute',
  aliases: ['untimeout'],
  description: 'remove timeout from a member',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ModerateMembers],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('remove timeout from a member')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });
    await target.timeout(null);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `unmuted **${target.user.tag}**`)] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    await target.timeout(null);
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'success', `unmuted **${target.user.tag}**`)] });
  },
};

export default cmd;
