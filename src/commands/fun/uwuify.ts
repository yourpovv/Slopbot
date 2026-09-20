import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { uwuifyEmbed } from '../../services/embeds';

const STUTTER_CHANCE = 0.15;
const ELONGATE_CHANCE = 0.25;
const ELONGATE_MIN = 1;
const ELONGATE_MAX = 3;
const TILDE_CHANCE = 0.3;
const INTERJECTION_CHANCE = 0.45;
const SUFFIX_CHANCE = 0.35;

const FACES = ['owo', 'uwu', '>_<', ':3', '>w<', '^-^', '^_^', '>.<'];
const INTERJECTIONS = ['owo', 'uwu', '>_<', ':3', '>w<', '^_^', 'nya~', 'rawr~', 'meow~'];
const SUFFIXES = ['uwu', 'owo', '>w<', ':3', '^-^', 'nya~', 'rawr~'];

const CUTE_SWAPS: [RegExp, string][] = [
  [/\beat\b/gi, 'nom nom'],
  [/\bsleep\b/gi, 'nap~'],
  [/\bhello\b/gi, 'hewwo~'],
  [/\bhi\b/gi, 'hewwo~'],
  [/\bhey\b/gi, 'hewwo~'],
  [/\bfriend\b/gi, 'fwiend~'],
  [/\bfriends\b/gi, 'fwiends~'],
  [/\blove\b/gi, 'wuv'],
  [/\bhappy\b/gi, 'so happy~'],
  [/\bsad\b/gi, 'so sowwy~'],
  [/\byes\b/gi, 'y-yes~'],
  [/\bno\b/gi, 'n-no~'],
  [/\bgood\b/gi, 'so good~'],
  [/\bbad\b/gi, 'so bad~'],
  [/\bplease\b/gi, 'pwease~'],
  [/\bthanks?\b/gi, 'thankies~'],
  [/\bthank you\b/gi, 'thankies~'],
  [/\bsorry\b/gi, 'sowwy~'],
  [/\bstop\b/gi, 's-stop~'],
  [/\bwhat\b/gi, 'w-what~'],
  [/\bwhy\b/gi, 'w-why~'],
  [/\bcute\b/gi, 'kawaiii'],
  [/\bkill\b/gi, 'unalive'],
  [/\bdie\b/gi, 'go nini forever'],
  [/\bfight\b/gi, 'bap bap'],
  [/\bhug\b/gi, 'glomp'],
  [/\bkiss\b/gi, 'smooch~'],
  [/\bboy\b/gi, 'boi~'],
  [/\bgirl\b/gi, 'giwl~'],
  [/\bperson\b/gi, 'hooman~'],
  [/\bpeople\b/gi, 'hoomans~'],
  [/\bppl\b/gi, 'hoomans~'],
  [/\btbh\b/gi, 'to be honyest~'],
  [/\bngl\b/gi, 'nyot gonnya wie~'],
  [/\bfr\b/gi, 'fow weaw~'],
  [/\bimo\b/gi, 'in my opinyion~'],
  [/\bidk\b/gi, 'i dunno~'],
  [/\bidc\b/gi, 'i dun cawe~'],
  [/\bidgaf\b/gi, 'i dun cawe at aww~'],
  [/\bbruh\b/gi, 'bwuh~'],
  [/\bbrb\b/gi, 'be wight back~'],
  [/\bgtg\b/gi, 'gotta go nya~'],
  [/\bomg\b/gi, 'oh my gawsh~'],
  [/\bomfg\b/gi, 'oh my fweaking gawsh~'],
  [/\bwth\b/gi, 'w-what da heck~'],
  [/\bwtf\b/gi, 'w-what da fwick~'],
  [/\blmao\b/gi, 'wahaha~'],
  [/\blmfao\b/gi, 'WAHAHAHA~'],
  [/\blol\b/gi, 'tehehe~'],
  [/\bgg\b/gi, 'good game~ uwu'],
  [/\bgn\b/gi, 'nighty night~'],
  [/\bgm\b/gi, 'good mowning~'],
  [/\bty\b/gi, 'thankies~'],
  [/\bnp\b/gi, 'no pwobwem~'],
  [/\bstfu\b/gi, 's-shush~'],
  [/\bsmh\b/gi, 'shakes my wittle head~'],
  [/\bfml\b/gi, 'fwick my wife~'],
  [/\bafk\b/gi, 'away fwom keyboawd~'],
  [/\brn\b/gi, 'wight nyow~'],
  [/\bik\b/gi, 'i knyow~'],
  [/\bwyd\b/gi, 'watcha doin~'],
  [/\bhmu\b/gi, 'tawk to me~'],
  [/\bgoat\b/gi, 'da gwatest~'],
  [/\bsus\b/gi, 'suspicious~ owo'],
  [/\bcap\b/gi, 'wying~'],
  [/\bnocap\b/gi, 'fow weaw~'],
  [/\bno cap\b/gi, 'fow weaw~'],
  [/\bbet\b/gi, 'okii~'],
  [/\bvibing?\b/gi, 'vibin nyaa~'],
  [/\bslay\b/gi, 'so kawaiii~'],
  [/\bfinna\b/gi, 'aboutta~'],
  [/\blowkey\b/gi, 'secwetwy~'],
  [/\bhighkey\b/gi, 'totawwy~'],
  [/\briz+\b/gi, 'chawm~ uwu'],
  [/\bskibidi\b/gi, 'skibidi nya~'],
  [/\bbro\b/gi, 'bwo~'],
  [/\bdude\b/gi, 'dood~'],
  [/\bman\b/gi, 'myan~'],
  [/\bguys\b/gi, 'evewyone~'],
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(pct: number): boolean {
  return Math.random() < pct;
}

function convert(text: string): string {
  let out = text;

  for (const [pattern, replacement] of CUTE_SWAPS) {
    out = out.replace(pattern, replacement);
  }

  out = out
    .replace(/r/g, 'w')
    .replace(/R/g, 'W')
    .replace(/l/g, 'w')
    .replace(/L/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/N([AEIOU])/g, 'NY$1')
    .replace(/ove/g, 'uv')
    .replace(/th/g, 'd')
    .replace(/Th/g, 'D')
    .replace(/TH/g, 'D');

  out = out.replace(/\b([a-zA-Z])/g, (_, first: string) => {
    if (!/[aeiouAEIOU]/.test(first) && chance(STUTTER_CHANCE)) {
      return `${first}-${first}`;
    }
    return first;
  });

  out = out.replace(/[aeiouAEIOU]/g, (v) => {
    if (chance(ELONGATE_CHANCE)) {
      const extra = ELONGATE_MIN + Math.floor(Math.random() * (ELONGATE_MAX - ELONGATE_MIN + 1));
      return v + v.repeat(extra);
    }
    return v;
  });

  const words = out.split(/(\s+)/);
  const injected: string[] = [];
  for (const w of words) {
    injected.push(w);
    if (/\S/.test(w) && chance(INTERJECTION_CHANCE)) {
      injected.push(` ${pick(INTERJECTIONS)}`);
    }
  }
  out = injected.join('');

  out = out.replace(/([.!?]+)/g, (punct) => {
    let result = punct;
    if (chance(TILDE_CHANCE)) result += '~';
    if (chance(SUFFIX_CHANCE)) result += ` ${pick(SUFFIXES)}`;
    return result;
  });

  if (!/[.!?]/.test(out) && chance(SUFFIX_CHANCE)) {
    out += `~ ${pick(FACES)}`;
  }

  return out;
}

const cmd: Command = {
  name: 'uwuify',
  aliases: ['uwu', 'owo'],
  description: 'uwuify some text',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('uwuify')
    .setDescription('uwuify some text')
    .addStringOption(o => o.setName('text').setDescription('what to uwuify').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const text = i.options.getString('text', true);
    const embed = uwuifyEmbed(i.guildId!, convert(text));
    await i.reply({ embeds: [embed] });
  },

  async prefix(msg: Message, args: string[]) {
    const text = args.join(' ');
    if (!text) return void await msg.reply('type something to uwuify');
    const embed = uwuifyEmbed(msg.guildId!, convert(text));
    await msg.reply({ embeds: [embed] });
  },
};

export default cmd;
