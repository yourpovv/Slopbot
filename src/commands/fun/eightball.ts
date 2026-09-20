import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';
import { pick } from './random';

const ANSWERS = [
  'yes', 'no', 'maybe', 'absolutely', 'never', 'ask again later',
  'without a doubt', 'dont count on it', 'for sure', 'hell no',
  'obviously', 'nah', 'probably', 'absolutely not', 'yep',
  'the stars say yes', 'my sources say no', 'signs point to yes',
  'very doubtful', 'it is certain',
];

const cmd: Command = {
  name: '8ball',
  aliases: ['eightball', 'ask'],
  description: 'ask the magic 8ball',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('ask the magic 8ball')
    .addStringOption(o => o.setName('question').setDescription('your question').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const q = i.options.getString('question', true);
    await i.reply({ embeds: [titled(i.guildId!, 'info', '🎱 8ball', `**Q:** ${q}\n**A:** ${pick(ANSWERS)}`)] });
  },

  async prefix(msg: Message, args: string[]) {
    const q = args.join(' ');
    if (!q) return void await msg.reply('ask a question');
    await msg.reply({ embeds: [titled(msg.guildId!, 'info', '🎱 8ball', `**Q:** ${q}\n**A:** ${pick(ANSWERS)}`)] });
  },
};

export default cmd;
