import { MessageReaction, User } from 'discord.js';
import { onReactionRemove } from '../services/starboard';

export default {
  name: 'messageReactionRemove',
  once: false,
  async run(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot) return;
    await onReactionRemove(reaction, user);
  },
};
