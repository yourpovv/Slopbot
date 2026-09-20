import { SlashCommandBuilder, ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import { pick } from '../fun/random';
import { canNick } from './nickcheck';

const SUFFIXES = [
  'isgay', 'isfat', 'ishit', 'iscool', 'stinks', 'ismid',
  'iscooked', 'iscracked', 'isbroken', 'isfried', 'isvalid',
  'isabottom', 'isatop', 'isawful', 'isgoated', 'isbasic',
  'isabum', 'isdusty', 'iscringe', 'isbased', 'issalty',
  'istoxic', 'issoft', 'isdown', 'isbad', 'iscooked',
  'isover', 'isscary', 'iscurious', 'isweird', 'simps',
  'smells', 'sucks', 'snores', 'drools', 'cries',
  'eatsglue', 'eatsdirt', 'lovescats', 'lovesdogs', 
  'rages', 'lurks', 'trolls', 'copes', 'malds',
  'isNPC', 'isAFK', 'isOP', 'issmelly', 'isnapping',
];

const cmd: Command = {
  name: 'nickname',
  aliases: ['nick'],
  description: 'add a random suffix to your nickname',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('add a random suffix to your nickname'),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member as GuildMember;
    const err = canNick(member.guild, member);
    if (err) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', err)] });
    const pattern = new RegExp(`(${SUFFIXES.join('|')})$`, 'i');
    const base = member.displayName.replace(pattern, '').trim();
    const suffix = pick(SUFFIXES);
    await member.setNickname(`${base}${suffix}`);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `nickname set to **${base}${suffix}**`)] });
  },

  async prefix(msg: Message) {
    const member = msg.member!;
    const err = canNick(member.guild, member);
    if (err) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', err)] });
    const pattern = new RegExp(`(${SUFFIXES.join('|')})$`, 'i');
    const base = member.displayName.replace(pattern, '').trim();
    const suffix = pick(SUFFIXES);
    await member.setNickname(`${base}${suffix}`);
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'success', `nickname set to **${base}${suffix}**`)] });
  },
};

export default cmd;
