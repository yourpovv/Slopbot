import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, nerdifiedEmbed, unnerdifiedEmbed, nerdifylistEmbed } from '../../services/embeds';
import * as nerdifies from '../../data/nerdifies';

export const nerdify: Command = {
  name: 'nerdify',
  aliases: ['nerd'],
  description: 'react with 🤓 to all messages from a user',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('nerdify')
    .setDescription('react with 🤓 to all messages from a user')
    .addUserOption(o => o.setName('user').setDescription('who to nerdify').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    const isNerdified = nerdifies.isNerdified(i.guildId!, i.user.id, target.id);
    
    if (isNerdified) {
      nerdifies.unnerdify(i.guildId!, i.user.id, target.id);
      const embed = unnerdifiedEmbed(i.guildId!, target.toString());
      await i.reply({ embeds: [embed] });
    } else {
      nerdifies.nerdify(i.guildId!, i.user.id, target.id);
      const embed = nerdifiedEmbed(i.guildId!, target.toString());
      await i.reply({ embeds: [embed] });
    }
  },

  async prefix(msg: Message) {
    const target = msg.mentions.users.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    
    const isNerdified = nerdifies.isNerdified(msg.guildId!, msg.author.id, target.id);
    
    if (isNerdified) {
      nerdifies.unnerdify(msg.guildId!, msg.author.id, target.id);
      const embed = unnerdifiedEmbed(msg.guildId!, target.toString());
      await msg.reply({ embeds: [embed] });
    } else {
      nerdifies.nerdify(msg.guildId!, msg.author.id, target.id);
      const embed = nerdifiedEmbed(msg.guildId!, target.toString());
      await msg.reply({ embeds: [embed] });
    }
  },
};

export const unnerdify: Command = {
  name: 'unnerdify',
  aliases: ['unnerd'],
  description: 'stop nerdifying a user',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('unnerdify')
    .setDescription('stop nerdifying a user')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    nerdifies.unnerdify(i.guildId!, i.user.id, target.id);
    const embed = unnerdifiedEmbed(i.guildId!, target.toString());
    await i.reply({ embeds: [embed] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.users.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    nerdifies.unnerdify(msg.guildId!, msg.author.id, target.id);
    const embed = unnerdifiedEmbed(msg.guildId!, target.toString());
    await msg.reply({ embeds: [embed] });
  },
};

export const nerdifylist: Command = {
  name: 'nerdifylist',
  aliases: ['nerdlist', 'nerdified'],
  description: 'view your nerdified users',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('nerdifylist')
    .setDescription('view your nerdified users'),

  async run(i: ChatInputCommandInteraction) {
    const ids = nerdifies.getNerdifiedIds(i.guildId!, i.user.id);
    const embed = nerdifylistEmbed(i.guildId!, ids);
    await i.reply({ embeds: [embed] });
  },

  async prefix(msg: Message) {
    const ids = nerdifies.getNerdifiedIds(msg.guildId!, msg.author.id);
    const embed = nerdifylistEmbed(msg.guildId!, ids);
    await msg.reply({ embeds: [embed] });
  },
};
