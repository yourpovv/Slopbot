import { Message } from 'discord.js';

interface Trigger {
  match: RegExp;
  chance: number;
  reply: string | string[];
}

const triggers: Trigger[] = [
  { match: /^(gm|good\s?morning)/i, chance: 0.7, reply: ['gm ☀️', 'morning!', 'rise and shine', 'gm gm', 'good morning 🌅', 'top of the morning'] },
  { match: /^(gn|good\s?night)/i, chance: 0.7, reply: ['gn 🌙', 'nighty night', 'sleep well', 'sweet dreams', 'gn gn', 'dont let the bed bugs bite'] },
  { match: /^(yo|hey|sup)\b/i, chance: 0.5, reply: ['yo', 'sup', 'hey', 'waddup', 'yooo', 'hii'] },
  { match: /^(hi|hello|hola)\b/i, chance: 0.5, reply: ['hey', 'hi', 'hello', 'hola', 'heyy'] },
  { match: /^(bye|cya|peace)\b/i, chance: 0.5, reply: ['peace ✌️', 'cya', 'later', 'bye bye', 'dip safely'] },

  { match: /^gg\b/i, chance: 0.4, reply: ['gg 🫡', 'gg wp', 'good game fr', 'gg ez', 'ggs'] },
  { match: /\bL\b/, chance: 0.4, reply: ['massive L', 'L + ratio', 'fat L', 'L bozo', 'packwatch 🚬'] },
  { match: /\bW\b/, chance: 0.4, reply: ['W', 'WW', 'dub', 'big W', 'W take', 'common W'] },
  { match: /^(lol|lmao|lmfao|💀)/i, chance: 0.3, reply: ['💀', 'LMFAO', 'LMAO', '😭', 'DEAD', 'NAHHH 💀', 'im crying'] },
  { match: /\bno\s?way\b/i, chance: 0.3, reply: ['no way', 'cap', 'aint no way', 'bro what 💀'] },
  { match: /\bwhat\b/i, chance: 0.15, reply: ['what', 'huh', '???', 'bro what'] },
  { match: /\bfr\b/i, chance: 0.2, reply: ['fr fr', 'on god', 'real', 'deadass'] },
  { match: /\bbet\b/i, chance: 0.3, reply: ['bet', 'say less', 'aight bet'] },

  { match: /\bbruh\b/i, chance: 0.3, reply: ['bruh', 'certified chud', '💀', 'bro', 'moment'] },
  { match: /\bdeez\b/i, chance: 0.5, reply: '🥜' },
  { match: /\bbored\b/i, chance: 0.4, reply: ['go outside', 'start a convo then', 'ping chat revive', 'touch grass', 'skill issue'] },
  { match: /\bcap\b/i, chance: 0.3, reply: ['no cap?', '🧢', 'cap detected', 'thats cap'] },
  { match: /\bsus\b/i, chance: 0.3, reply: ['📮', 'sussy', 'kinda sus ngl', 'amogus'] },
  { match: /\boof\b/i, chance: 0.3, reply: ['big oof', 'oof size: large', 'rip', '💀'] },
  { match: /\brip\b/i, chance: 0.3, reply: ['rip 🪦', 'gone but not forgotten', 'F', 'rest in pepperoni'] },
  { match: /\bpog\b/i, chance: 0.3, reply: ['poggers', 'POGG', 'pog moment', 'lets gooo'] },
  { match: /\bnah\b/i, chance: 0.15, reply: ['nah fr', 'nah 💀', 'hell nah'] },
  { match: /\bwhy\b/i, chance: 0.1, reply: ['why not', 'good question', 'because'] },
  { match: /\bstfu\b/i, chance: 0.3, reply: ['no u', 'make me', '🤫'] },
];

const COOLDOWN_MS = 5000;
let lastReply = 0;

export async function respond(msg: Message): Promise<void> {
  if (msg.author.bot || !msg.guild) return;

  const clean = msg.content.replace(/<@!?\d+>/g, '').trim();
  if (!clean) return;

  const now = Date.now();
  if (now - lastReply < COOLDOWN_MS) return;

  for (const t of triggers) {
    if (!t.match.test(clean)) continue;
    if (Math.random() > t.chance) return;
    lastReply = now;
    await msg.reply(pick(t.reply));
    return;
  }
}

function pick(reply: string | string[]): string {
  return Array.isArray(reply) ? reply[Math.floor(Math.random() * reply.length)] : reply;
}
