import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '../../types';
import { fakeModEmbed } from '../../services/embeds';

const SPAM_COUNT = 5;

const cmd: Command = {
  name: 'fakenuke',
  aliases: ['fnuke'],
  description: 'fake nuke the server (spams empty messages)',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('fakenuke')
    .setDescription('fake nuke the server (spams empty messages)'),

  async run(i: ChatInputCommandInteraction) {
    const channel = i.channel as TextChannel;
    if (!channel) return;

    const { embed, file } = fakeModEmbed(i.guildId!, 'nuking server...');
    await i.reply({ embeds: [embed], files: [file] });

    const emptyEmbed = new EmbedBuilder().setDescription('\u200b');
    
    for (let count = 0; count < SPAM_COUNT; count++) {
      await channel.send({ embeds: [emptyEmbed] });
    }
  },

  async prefix(msg: Message) {
    const channel = msg.channel as TextChannel;
    if (!channel) return;

    const { embed, file } = fakeModEmbed(msg.guildId!, 'nuking server...');
    await msg.reply({ embeds: [embed], files: [file] });

    const emptyEmbed = new EmbedBuilder().setDescription('\u200b');
    
    for (let count = 0; count < SPAM_COUNT; count++) {
      await channel.send({ embeds: [emptyEmbed] });
    }
  },
};

export default cmd;
