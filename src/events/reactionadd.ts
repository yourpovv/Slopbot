import { MessageReaction, User } from 'discord.js';
import { onReactionAdd } from '../services/starboard';

export default {
  name: 'messageReactionAdd',
  once: false,
  async run(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot) return;
    await onReactionAdd(reaction, user);
  },
};
