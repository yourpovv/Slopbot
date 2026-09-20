import { SlashCommandBuilder, ChatInputCommandInteraction, Message, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';
import { pick } from './random';

const cmd: Command = {
  name: 'thisorthat',
  aliases: ['choose', 'pick', 'decide'],
  description: 'pick between options',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('thisorthat')
    .setDescription('pick between options')
    .addStringOption(o => o.setName('options').setDescription('options separated by ,').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const raw = i.options.getString('options', true);
    const opts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (opts.length < 2) return void await i.reply({ embeds: [titled(i.guildId!, 'error', 'error', 'give at least 2 options separated by ,')], flags: MessageFlags.Ephemeral });
    await i.reply({ embeds: [titled(i.guildId!, 'info', '🤔 this or that', `i choose... **${pick(opts)}**`)] });
  },

  async prefix(msg: Message, args: string[]) {
    const opts = args.join(' ').split(',').map(s => s.trim()).filter(Boolean);
    if (opts.length < 2) return void await msg.reply('give at least 2 options separated by ,');
    await msg.reply({ embeds: [titled(msg.guildId!, 'info', '🤔 this or that', `i choose... **${pick(opts)}**`)] });
  },
};

export default cmd;
