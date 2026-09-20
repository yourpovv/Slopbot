import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';
import { pick } from './random';
import { COLORS } from '../../config';
import { getBrand } from '../../data/brand';


const ACTIONS: Record<string, string[]> = {
  punch: [
    'threw a haymaker at {target}',
    'sucker punched {target} into next week',
    'gave {target} the ol\' one-two',
    'landed a clean right hook on {target}',
  ],
  slap: [
    'slapped {target} across the face',
    'hit {target} with a fish',
    'delivered a crisp backhand to {target}',
    'gave {target} a reality check',
  ],
  rpkick: [
    'roundhouse kicked {target} into orbit',
    'punted {target} across the room',
    'gave {target} a spinning kick',
    'drop-kicked {target} out the window',
  ],
  kill: [
    'deleted {target} from existence',
    'sent {target} to the shadow realm',
    'used {target} as a sacrifice to the discord gods',
    'uninstalled {target}\'s life subscription',
  ],
  abuse: [
    'bullied {target} relentlessly',
    'roasted {target} so hard they logged off',
    'made {target} question their life choices',
    'emotionally destroyed {target}',
  ],
};


const GIF_CATEGORY: Record<string, string> = {
  punch: 'punch',
  slap:  'slap',
  rpkick: 'kick',
  kill:  'shoot',
  abuse: 'baka',
};

async function fetchGif(action: string): Promise<string | null> {
  const category = GIF_CATEGORY[action] ?? action;
  try {
    const res = await fetch(`https://nekos.best/api/v2/${category}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { results: { url: string }[] };
    return data.results?.[0]?.url ?? null;
  } catch {
    return null;
  }
}


const SPAM_WARN_REASONS = [
  'existing',
  'breathing too loud',
  'having bad vibes',
  'cringe',
  'being online',
  'skill issue',
  'ratio',
  'no reason needed',
  'just because',
];

const SPAM_WARN_COUNT = 4;
const SPAM_WARN_DELAY_MS = 600;

async function spamWarn(guildId: string, channel: TextChannel, targetTag: string): Promise<void> {
  for (let i = 0; i < SPAM_WARN_COUNT; i++) {
    const reason = pick(SPAM_WARN_REASONS);
    const embed = new EmbedBuilder()
      .setColor(COLORS.warn)
      .setDescription(`⚠️ warned **${targetTag}** - ${reason}`)
      .setFooter({ text: getBrand(guildId) });
    await channel.send({ embeds: [embed] });
    if (i < SPAM_WARN_COUNT - 1) {
      await new Promise(r => setTimeout(r, SPAM_WARN_DELAY_MS));
    }
  }
}


function actionSlash(name: string, desc: string) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc)
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true));
}

function renderAction(lines: string[], target: string): string {
  return pick(lines).replace('{target}', target);
}

function actionEmbed(guildId: string, name: string, emoji: string, text: string, gifUrl: string | null): EmbedBuilder {
  const embed = titled(guildId, 'default', `${emoji} ${name}`, text);
  if (gifUrl) embed.setImage(gifUrl);
  return embed;
}

function makeAction(name: string, desc: string, emoji: string): Command {
  const lines = ACTIONS[name] ?? [`${emoji} ${name}ed {target}`];
  const isAbuse = name === 'abuse';

  return {
    name, aliases: [], description: desc, cooldown: 0,
    permissions: [], staffOnly: false,
    slash: actionSlash(name, desc),

    async run(i: ChatInputCommandInteraction) {
      const target = i.options.getUser('user', true);
      const text = renderAction(lines, target.toString());
      const gif = await fetchGif(name);
      await i.reply({ embeds: [actionEmbed(i.guildId!, name, emoji, `${i.user} ${text}`, gif)] });

      if (isAbuse) {
        const channel = i.channel as TextChannel;
        await spamWarn(i.guildId!, channel, target.tag);
      }
    },

    async prefix(msg: Message) {
      const target = msg.mentions.users.first();
      if (!target) return void await msg.reply('mention someone');
      const text = renderAction(lines, target.toString());
      const gif = await fetchGif(name);
      await msg.reply({ embeds: [actionEmbed(msg.guildId!, name, emoji, `${msg.author} ${text}`, gif)] });

      if (isAbuse) {
        const channel = msg.channel as TextChannel;
        await spamWarn(msg.guildId!, channel, target.tag);
      }
    },
  };
}


export const punch  = makeAction('punch',  'punch someone',              '👊');
export const slap   = makeAction('slap',   'slap someone',              '🫲');
export const rpkick = makeAction('rpkick', 'kick someone (roleplay)',   '🦵');
export const kill   = makeAction('kill',   'eliminate someone',         '💀');
export const abuse  = makeAction('abuse',  'bully someone',            '😈');
