import { SlashCommandBuilder, ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import { canNick } from './nickcheck';

const NICK_LIMIT = 32;

type Style = 'spaced' | 'smallcaps' | 'glitch' | 'mirror';

const SMALLCAPS: Record<string, string> = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ',
  i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
  q: 'ꞯ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
  y: 'ʏ', z: 'ᴢ',
};

const MIRROR: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ',
  i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd',
  q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x',
  y: 'ʎ', z: 'z',
};

const cmd: Command = {
  name: 'nickstyle',
  aliases: ['ns'],
  description: 'style your nickname',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('nickstyle')
    .setDescription('style your nickname')
    .addStringOption(o =>
      o.setName('style')
        .setDescription('style to apply')
        .setRequired(true)
        .addChoices(
          { name: 'spaced → p o v', value: 'spaced' },
          { name: 'smallcaps → ᴘᴏᴠ', value: 'smallcaps' },
          { name: 'glitch → p̷o̷v̷', value: 'glitch' },
          { name: 'mirror → ʇoʌ', value: 'mirror' },
        )
    ),

  async run(i: ChatInputCommandInteraction) {
    const style = i.options.getString('style', true) as Style;
    const member = i.member as GuildMember;
    const err = canNick(member.guild, member);
    if (err) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', err)] });
    const styled = apply(member.displayName, style);
    await member.setNickname(styled.slice(0, NICK_LIMIT));
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `nickname: **${styled}**`)] });
  },

  async prefix(msg: Message, args: string[]) {
    const style = args[0]?.toLowerCase() as Style;
    if (!['spaced', 'smallcaps', 'glitch', 'mirror'].includes(style)) {
      return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'styles: spaced, smallcaps, glitch, mirror')] });
    }
    const member = msg.member!;
    const err = canNick(member.guild, member);
    if (err) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', err)] });
    const styled = apply(member.displayName, style);
    await member.setNickname(styled.slice(0, NICK_LIMIT));
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'success', `nickname: **${styled}**`)] });
  },
};

function apply(name: string, style: Style): string {
  const clean = name.replace(/^\[.*?\]\s*/, '').trim().toLowerCase();
  if (style === 'spaced') return clean.split('').join(' ');
  if (style === 'smallcaps') return mapChars(clean, SMALLCAPS);
  if (style === 'glitch') return clean.split('').map(c => c + '\u0337').join('');
  if (style === 'mirror') return mapChars(clean, MIRROR).split('').reverse().join('');
  return clean;
}

function mapChars(text: string, map: Record<string, string>): string {
  return text.split('').map(c => map[c] ?? c).join('');
}

export default cmd;
