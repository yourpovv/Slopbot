import { Interaction } from 'discord.js';
import { onInteraction } from '../services/dispatch';
import { onButton, onSelectMenu, onModalSubmit } from '../services/interactions';

export default {
  name: 'interactionCreate',
  once: false,
  async run(i: Interaction): Promise<void> {
    try {
      if (i.isChatInputCommand()) return onInteraction(i);
      if (i.isButton()) return onButton(i);
      if (i.isStringSelectMenu()) return onSelectMenu(i);
      if (i.isModalSubmit()) return onModalSubmit(i);
    } catch (err) {
      console.error('[interaction]', err instanceof Error ? err.message : err);
    }
  },
};
