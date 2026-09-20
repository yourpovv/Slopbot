import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';
import { pick } from './random';

const MAX_SCORE = 11;

const CATEGORIES = [
  { name: 'looks', emoji: '👀' },
  { name: 'rizz', emoji: '😏' },
  { name: 'humor', emoji: '😂' },
  { name: 'intelligence', emoji: '🧠' },
  { name: 'vibe', emoji: '✨' },
  { name: 'sus level', emoji: '📮' },
];

const COMMENTARY: Record<string, Record<'low' | 'mid' | 'high', string[]>> = {
  looks: {
    low: ['maybe try a paper bag?', 'your mirror filed a restraining order', 'not your strong suit'],
    mid: ['mid but could be worse', 'solid 50/50', 'you exist and that\'s something'],
    high: ['genuinely attractive ngl', 'model material??', 'ok fine you\'re hot'],
  },
  rizz: {
    low: ['negative rizz detected', 'the wall has more game', 'you fumble everything'],
    mid: ['occasionally smooth', 'rizz under construction', 'mid game but you try'],
    high: ['certified rizzler', 'people fall at your feet', 'teach me your ways'],
  },
  humor: {
    low: ['your jokes make people cry', 'comedy isn\'t for everyone', 'the silence after your jokes is deafening'],
    mid: ['you get a pity laugh sometimes', 'hit or miss energy', 'funny enough to keep around'],
    high: ['actually hilarious', 'certified class clown', 'stand-up career when?'],
  },
  intelligence: {
    low: ['smooth brain energy', 'room temperature iq', 'bless your heart'],
    mid: ['average but functional', 'one braincell doing its best', 'you know some things'],
    high: ['big brain moment', 'actually scary smart', 'ok nerd'],
  },
  vibe: {
    low: ['you kill the vibe on arrival', 'negative energy aura', 'people leave when you join vc'],
    mid: ['neutral energy', 'you\'re just... there', 'wallflower vibes'],
    high: ['immaculate vibes', 'everyone wants you around', 'main character energy'],
  },
  'sus level': {
    low: ['certified innocent', 'nothing to see here', 'squeaky clean'],
    mid: ['mildly suspicious', 'i\'m watching you', 'something\'s off'],
    high: ['SUSSY BAKA', 'among us moment', 'straight to the brig'],
  },
};

const VERDICTS: Record<string, string[]> = {
  terrible: ['yikes. just yikes.', 'there\'s always next life', 'i\'ll pray for you'],
  bad: ['rough results ngl', 'could be... better', 'we all have bad days (yours is permanent)'],
  mid: ['aggressively average', 'the physical form of "meh"', 'perfectly mid in every way'],
  good: ['actually kinda goated', 'solid performance', 'better than most tbh'],
  goated: ['actually goated', 'literal perfection', 'should\'ve been nerfed in the patch notes'],
};

function getRange(score: number): 'low' | 'mid' | 'high' {
  if (score <= 3) return 'low';
  if (score <= 6) return 'mid';
  return 'high';
}

const cmd: Command = {
  name: 'rate',
  aliases: ['rating'],
  description: 'rate someone randomly',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('rate')
    .setDescription('rate someone randomly')
    .addUserOption(o => o.setName('user').setDescription('who to rate').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const user = i.options.getUser('user', true);
    await i.reply({ embeds: [titled(i.guildId!, 'info', '📊 rating', buildRating(user.toString()))] });
  },

  async prefix(msg: Message) {
    const user = msg.mentions.users.first() ?? msg.author;
    await msg.reply({ embeds: [titled(msg.guildId!, 'info', '📊 rating', buildRating(user.toString()))] });
  },
};

function buildRating(mention: string): string {
  let total = 0;
  const lines = CATEGORIES.map(c => {
    const score = Math.floor(Math.random() * MAX_SCORE);
    total += score;
    const range = getRange(score);
    const comments = COMMENTARY[c.name]?.[range] ?? [];
    const comment = comments.length > 0 ? pick(comments) : '';
    return `${c.emoji} **${c.name}:** ${score}/10 - *${comment}*`;
  });

  const avg = total / CATEGORIES.length;
  let pool: string[];
  if (avg <= 2) pool = VERDICTS.terrible;
  else if (avg <= 4) pool = VERDICTS.bad;
  else if (avg <= 6) pool = VERDICTS.mid;
  else if (avg <= 8) pool = VERDICTS.good;
  else pool = VERDICTS.goated;

  return `${mention}\n\n${lines.join('\n')}\n\n**verdict:** ${pick(pool)}`;
}

export default cmd;
