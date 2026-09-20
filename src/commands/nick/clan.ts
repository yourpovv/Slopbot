import { SlashCommandBuilder, ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import { canNick } from './nickcheck';

const MAX_TAG = 10;

const cmd: Command = {
  name: 'clan',
  aliases: ['clantag'],
  description: 'add a clan tag to your nickname',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('clan')
    .setDescription('add a clan tag to your nickname')
    .addStringOption(o => o.setName('tag').setDescription('clan tag (e.g. VOID)').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const tag = i.options.getString('tag', true).slice(0, MAX_TAG);
    const member = i.member as GuildMember;
    const err = canNick(member.guild, member);
    if (err) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', err)] });
    const base = stripTag(member.displayName);
    await member.setNickname(`[${tag}] ${base}`);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `clan tag set: **[${tag}] ${base}**`)] });
  },

  async prefix(msg: Message, args: string[]) {
    const tag = args[0]?.slice(0, MAX_TAG);
    if (!tag) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'usage: .clan VOID')] });
    const member = msg.member!;
    const err = canNick(member.guild, member);
    if (err) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', err)] });
    const base = stripTag(member.displayName);
    await member.setNickname(`[${tag}] ${base}`);
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'success', `clan tag set: **[${tag}] ${base}**`)] });
  },
};

function stripTag(name: string): string {
  return name.replace(/^\[.*?\]\s*/, '').trim();
}

export default cmd;
