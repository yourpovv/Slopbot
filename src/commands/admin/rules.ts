import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, rulesEmbed } from '../../services/embeds';

const SERVER_RULES = [
  '・ follow tos',
  '・ dont be weird',
  '・ no gore or nsfw',
  '・ no self promo',
  '・ no leaking',
  '・ no spam',
];

const cmd: Command = {
  name: 'rules',
  aliases: ['setuprules'],
  description: 'send the rules embed',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('send the rules embed'),

  async run(i: ChatInputCommandInteraction) {
    const { embed, file } = rulesEmbed(i.guildId!, SERVER_RULES);
    await (i.channel as TextChannel).send({ embeds: [embed], files: [file] });
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', 'rules posted')], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message) {
    const { embed, file } = rulesEmbed(msg.guildId!, SERVER_RULES);
    await (msg.channel as TextChannel).send({ embeds: [embed], files: [file] });
  },
};

export default cmd;
