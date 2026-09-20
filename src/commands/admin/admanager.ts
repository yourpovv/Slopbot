import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  MessageFlags,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as ads from '../../data/ads';
import { ROLES, COLORS } from '../../config';
import { getBrand } from '../../data/brand';

export const adscreate: Command = {
  name: 'adscreate',
  aliases: ['createad', 'newad'],
  description: 'create a new ad (owner/admin only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('adscreate')
    .setDescription('create a new ad (owner/admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member;
    if (!member) return;

    // check if we are an owner or admin
    const hasOwner = ROLES.owner && (member as any).roles.cache.has(ROLES.owner);
    const hasAdmin = ROLES.admin && (member as any).roles.cache.has(ROLES.admin);

    if (!hasOwner && !hasAdmin) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only owners and admins can create ads')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('adscreate_modal')
      .setTitle('Create New Ad');

    const nameInput = new TextInputBuilder()
      .setCustomId('ad_name')
      .setLabel('Ad Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., "main server ad"')
      .setRequired(true)
      .setMaxLength(50);

    const inviteInput = new TextInputBuilder()
      .setCustomId('ad_invite')
      .setLabel('Invite Link')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., https://discord.gg/example')
      .setRequired(true)
      .setMaxLength(200);

    const nameRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput);
    const inviteRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(inviteInput);

    modal.addComponents(nameRow, inviteRow);
    await i.showModal(modal);
  },

  async prefix() {
  },
};

export const adsedit: Command = {
  name: 'adsedit',
  aliases: ['updatead'],
  description: 'edit an existing ad (owner/admin only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('adsedit')
    .setDescription('edit an existing ad (owner/admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(o => o.setName('id').setDescription('ad id').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member;
    if (!member) return;

    const hasOwner = ROLES.owner && (member as any).roles.cache.has(ROLES.owner);
    const hasAdmin = ROLES.admin && (member as any).roles.cache.has(ROLES.admin);

    if (!hasOwner && !hasAdmin) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only owners and admins can edit ads')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const adId = i.options.getInteger('id', true);
    const ad = ads.getAd(i.guildId!, adId);

    if (!ad) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'ad not found')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`adsedit_modal_${adId}`)
      .setTitle('Edit Ad');

    const nameInput = new TextInputBuilder()
      .setCustomId('ad_name')
      .setLabel('Ad Name')
      .setStyle(TextInputStyle.Short)
      .setValue(ad.name)
      .setRequired(true)
      .setMaxLength(50);

    const inviteInput = new TextInputBuilder()
      .setCustomId('ad_invite')
      .setLabel('Invite Link')
      .setStyle(TextInputStyle.Short)
      .setValue(ad.inviteLink)
      .setRequired(true)
      .setMaxLength(200);

    const nameRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput);
    const inviteRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(inviteInput);

    modal.addComponents(nameRow, inviteRow);
    await i.showModal(modal);
  },

  async prefix() {
  },
};

export const adsdelete: Command = {
  name: 'adsdelete',
  aliases: ['removead'],
  description: 'delete an ad (owner/admin only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('adsdelete')
    .setDescription('delete an ad (owner/admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(o => o.setName('id').setDescription('ad id').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member;
    if (!member) return;

    const hasOwner = ROLES.owner && (member as any).roles.cache.has(ROLES.owner);
    const hasAdmin = ROLES.admin && (member as any).roles.cache.has(ROLES.admin);

    if (!hasOwner && !hasAdmin) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only owners and admins can delete ads')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const adId = i.options.getInteger('id', true);
    const deleted = ads.deleteAd(i.guildId!, adId);

    if (!deleted) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'ad not found')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await i.reply({
      embeds: [brandEmbed(i.guildId!, 'success', `deleted ad #${adId}`)],
      flags: MessageFlags.Ephemeral,
    });
  },

  async prefix() {
  },
};

export const adslist: Command = {
  name: 'adslist',
  aliases: ['ads', 'listads'],
  description: 'list all ads (owner/admin only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('adslist')
    .setDescription('list all ads (owner/admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member;
    if (!member) return;

    const hasOwner = ROLES.owner && (member as any).roles.cache.has(ROLES.owner);
    const hasAdmin = ROLES.admin && (member as any).roles.cache.has(ROLES.admin);

    if (!hasOwner && !hasAdmin) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only owners and admins can view ads')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const allAds = ads.getAllAds(i.guildId!);

    if (allAds.length === 0) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'info', 'no ads created yet. use `/adscreate` to create one')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const adList = allAds
      .map(ad => `**ID ${ad.id}** - ${ad.name}\n  └ ${ad.inviteLink}`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.brand)
      .setTitle('📢 server ads')
      .setDescription(adList)
      .setFooter({ text: getBrand(i.guildId!) })
      .setTimestamp();

    await i.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  async prefix() {
  },
};

export const adspost: Command = {
  name: 'adspost',
  aliases: ['sendad', 'ad'],
  description: 'post an ad to the channel (owner/admin only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('adspost')
    .setDescription('post an ad to the channel (owner/admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(o => o.setName('id').setDescription('ad id').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member;
    if (!member) return;

    const hasOwner = ROLES.owner && (member as any).roles.cache.has(ROLES.owner);
    const hasAdmin = ROLES.admin && (member as any).roles.cache.has(ROLES.admin);

    if (!hasOwner && !hasAdmin) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only owners and admins can post ads')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const adId = i.options.getInteger('id', true);
    const ad = ads.getAd(i.guildId!, adId);

    if (!ad) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'ad not found')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.brand)
      .setDescription(
        `_ _\n` +
        `_ _         .              **[${ad.name}](${ad.inviteLink})**              \` 🍃 \`\n` +
        `_ _         stox  ﹒   __social__  ﹒   gws     𓂃\n` +
        `_ _         ꒰꒰      *join   for   active   **chats & vcs** * [⠀](${ad.inviteLink})\n` +
        `_ _`
      );

    const channel = i.channel as TextChannel;
    await channel.send({ embeds: [embed] });
    await i.reply({
      embeds: [brandEmbed(i.guildId!, 'success', 'ad posted')],
      flags: MessageFlags.Ephemeral,
    });
  },

  async prefix() {
  },
};
