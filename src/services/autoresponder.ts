import { Message } from 'discord.js';
import * as autoresponders from '../data/autoresponders';

export async function checkAutoresponders(msg: Message): Promise<void> {
  if (!msg.guild) return;
  if (msg.author.bot) return;
  
  const responders = autoresponders.getActiveResponders(msg.guildId!);
  if (responders.length === 0) return;
  
  for (const responder of responders) {
    const matches = matchTrigger(msg.content, responder.trigger, responder.matchFull);
    
    if (!matches) continue;
    
    const canTrigger = autoresponders.checkWait(responder.id);
    if (!canTrigger) continue;
    
    await sendResponse(msg, responder.response, responder.replyMode, responder.deleteTrigger);
    autoresponders.updateUsage(responder.id);
    
    break;
  }
}

function matchTrigger(content: string, trigger: string, matchFull: boolean): boolean {
  const lower = content.toLowerCase();
  const triggerLower = trigger.toLowerCase();
  
  if (matchFull) {
    return lower === triggerLower;
  }
  
  return lower.includes(triggerLower);
}

async function sendResponse(msg: Message, response: string, replyMode: boolean, deleteTrigger: boolean): Promise<void> {
  if (deleteTrigger) {
    await msg.delete().catch(() => {});
  }
  
  if (replyMode) {
    await msg.reply(response).catch(() => {});
  } else {
    if ('send' in msg.channel) {
      await msg.channel.send(response).catch(() => {});
    }
  }
}
