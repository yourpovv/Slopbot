import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, blockedEmbed, unblockedEmbed, blocklistEmbed } from '../../services/embeds';
import * as blocks from '../../data/blocks';

export const block: Command = {
  name: 'block',
  aliases: [],
  description: 'block a user (deletes all their messages)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('block')
    .setDescription('block a user (deletes all their messages)')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    if (target.bot) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'cannot block bots')] });
    blocks.block(i.guildId!, i.user.id, target.id);
    const { embed, file } = blockedEmbed(i.guildId!, target.toString());
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.users.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    if (target.bot) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'cannot block bots')] });
    blocks.block(msg.guildId!, msg.author.id, target.id);
    const { embed, file } = blockedEmbed(msg.guildId!, target.toString());
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

export const unblock: Command = {
  name: 'unblock',
  aliases: [],
  description: 'unblock a user',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('unblock')
    .setDescription('unblock a user')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    blocks.unblock(i.guildId!, i.user.id, target.id);
    const { embed, file } = unblockedEmbed(i.guildId!, target.toString());
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.users.first();    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    blocks.unblock(msg.guildId!, msg.author.id, target.id);
    const { embed, file } = unblockedEmbed(msg.guildId!, target.toString());
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

export const blocklist: Command = {
  name: 'blocklist',
  aliases: ['bl', 'blocked'],
  description: 'view your blocked users',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('blocklist')
    .setDescription('view your blocked users'),

  async run(i: ChatInputCommandInteraction) {
    const ids = blocks.getBlockedIds(i.guildId!, i.user.id);
    const { embed, file } = blocklistEmbed(i.guildId!, ids);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message) {
    const ids = blocks.getBlockedIds(msg.guildId!, msg.author.id);
    const { embed, file } = blocklistEmbed(msg.guildId!, ids);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};
