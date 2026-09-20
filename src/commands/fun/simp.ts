import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { simpEmbed } from '../../services/embeds';
import { rand } from './random';

const cmd: Command = {
  name: 'simp',
  aliases: [],
  description: 'how much of a simp are you for someone',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('simp')
    .setDescription('simp meter')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    const pct = rand(0, 100);
    const { embed, file } = simpEmbed(i.guildId!, i.user.toString(), target.toString(), pct);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.users.first();
    if (!target) return void await msg.reply('mention someone');
    const pct = rand(0, 100);
    const { embed, file } = simpEmbed(msg.guildId!, msg.author.toString(), target.toString(), pct);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

export default cmd;
