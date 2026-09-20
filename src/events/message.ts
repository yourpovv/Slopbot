import { Message } from 'discord.js';
import { onPrefix } from '../services/dispatch';
import { respond } from '../services/autorespond';
import { checkAutoresponders } from '../services/autoresponder';
import { processMessage as processLeveling } from '../services/leveling';
import { isBlockedByAnyone } from '../data/blocks';
import { isNerdifiedByAnyone } from '../data/nerdifies';

export default {
  name: 'messageCreate',
  once: false,
  async run(msg: Message): Promise<void> {
    if (msg.author.bot) return;
    if (!msg.guild) return;

    if (await deleteIfBlocked(msg)) return;
    await reactIfNerdified(msg);
    await checkAutoresponders(msg);
    await processLeveling(msg);
    await respond(msg);
    await onPrefix(msg);
  },
};

async function deleteIfBlocked(msg: Message): Promise<boolean> {
  if (!msg.guild) return false;
  const blockers = isBlockedByAnyone(msg.guild.id, msg.author.id);
  if (blockers.length === 0) return false;
  await msg.delete().catch(() => {});
  return true;
}

async function reactIfNerdified(msg: Message): Promise<void> {
  if (!msg.guild) return;
  const nerdifiers = isNerdifiedByAnyone(msg.guild.id, msg.author.id);
  if (nerdifiers.length === 0) return;
  await msg.react('🤓').catch(() => {});
}
