import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
} from 'discord.js';
import { Command } from '../../types';
import { pollEmbed } from '../../services/embeds';

const cmd: Command = {
  name: 'poll',
  aliases: ['vote'],
  description: 'create a poll',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('create a poll')
    .addStringOption(o => o.setName('question').setDescription('the question').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const question = i.options.getString('question', true);
    const { embed, file } = pollEmbed(i.guildId!, question, i.user.toString());
    await i.reply({ embeds: [embed], files: [file] });
    const msg = await i.fetchReply();
    await msg.react('✅');
    await msg.react('❌');
  },

  async prefix(msg: Message, args: string[]) {
    const question = args.join(' ');
    if (!question) return void await msg.reply('type a question');
    const { embed, file } = pollEmbed(msg.guildId!, question, msg.author.toString());
    const sent = await (msg.channel as TextChannel).send({ embeds: [embed], files: [file] });
    await sent.react('✅');
    await sent.react('❌');
  },
};

export default cmd;
