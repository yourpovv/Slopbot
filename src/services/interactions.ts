import { ButtonInteraction, StringSelectMenuInteraction, GuildMember, MessageFlags, ChannelType, PermissionFlagsBits, EmbedBuilder, TextChannel, ModalSubmitInteraction, PublicThreadChannel, VoiceChannel, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { brandEmbed, ticketCloseButton, ticketPanelEmbed, colorRolesMenu, genderRolesMenu, ageRolesMenu, otherRolesMenu } from './embeds';
import { markVerified, getConfig } from '../data/verify';
import { COLORS } from '../config';
import { lfgButton } from '../commands/fun/lfg';
import { giveawayButton } from '../commands/fun/giveaway';
import { helpButton } from '../commands/fun/help';
import * as tickets from '../data/tickets';
import * as ads from '../data/ads';
import * as guildConfig from '../data/guildconfig';
import * as voice from '../data/voice';
import { generateTranscript } from './transcript';
import { isStaff } from './permissions';

export async function onButton(i: ButtonInteraction): Promise<void> {
  if (i.customId === 'verify_btn') return verify(i);
  if (i.customId === 'create_ticket') return createTicket(i);
  if (i.customId === 'close_ticket') return closeTicket(i);
  if (i.customId === 'show_colors') return showColors(i);
  if (i.customId === 'show_gender') return showGender(i);
  if (i.customId === 'show_age') return showAge(i);
  if (i.customId === 'show_others') return showOthers(i);
  if (i.customId.startsWith('help_')) return helpButton(i);
  if (i.customId.startsWith('lfg_')) return routeLfg(i);
  if (i.customId.startsWith('giveaway_')) return routeGiveaway(i);
  if (i.customId.startsWith('vc_')) return handleVoiceButton(i);
}

export async function onSelectMenu(i: StringSelectMenuInteraction): Promise<void> {
  if (i.customId === 'color_role_select') return colorRole(i);
  if (i.customId === 'gender_role_select') return genderRole(i);
  if (i.customId === 'age_role_select') return ageRole(i);
  if (i.customId === 'alerts_role_select') return alertsRole(i);
  if (i.customId.startsWith('vc_action_')) return handleVoiceAction(i);
}

export async function onModalSubmit(i: ModalSubmitInteraction): Promise<void> {
  if (i.customId === 'ticket_panel_modal') return submitTicketPanel(i);
  if (i.customId === 'adscreate_modal') return submitAdCreate(i);
  if (i.customId.startsWith('adsedit_modal_')) return submitAdEdit(i);
  if (i.customId.startsWith('vc_')) return onVoiceModal(i);
}

async function showColors(i: ButtonInteraction): Promise<void> {
  const colorRoles = guildConfig.getColorRoles(i.guildId!);
  const { embed, row, file } = colorRolesMenu(i.guildId!, colorRoles);
  await i.reply({ embeds: [embed], components: [row], files: [file], flags: MessageFlags.Ephemeral });
}

async function showGender(i: ButtonInteraction): Promise<void> {
  if (!i.guild) return;
  const roleIds = guildConfig.getIdentityRolesByCategory(i.guildId!, 'gender');
  const { embed, row, file } = genderRolesMenu(i.guildId!, roleIds, i.guild);
  await i.reply({ embeds: [embed], components: [row], files: [file], flags: MessageFlags.Ephemeral });
}

async function showAge(i: ButtonInteraction): Promise<void> {
  if (!i.guild) return;
  const roleIds = guildConfig.getIdentityRolesByCategory(i.guildId!, 'age');
  const { embed, row, file } = ageRolesMenu(i.guildId!, roleIds, i.guild);
  await i.reply({ embeds: [embed], components: [row], files: [file], flags: MessageFlags.Ephemeral });
}

async function showOthers(i: ButtonInteraction): Promise<void> {
  const extraRoles = guildConfig.getExtraRoles(i.guildId!);
  const { embed, row, file } = otherRolesMenu(i.guildId!, extraRoles);
  await i.reply({ embeds: [embed], components: [row], files: [file], flags: MessageFlags.Ephemeral });
}

async function verify(i: ButtonInteraction): Promise<void> {
  if (!i.guild || !i.member) return;

  const cfg = getConfig(i.guild.id);
  if (!cfg) return replyEmbed(i, i.guildId!, 'error', 'verify not configured');

  const member = i.member as GuildMember;
  if (member.roles.cache.has(cfg.role_id)) return replyEmbed(i, i.guildId!, 'warn', 'already verified');

  const role = i.guild.roles.cache.get(cfg.role_id);
  if (!role) {
    return replyEmbed(i, i.guildId!, 'error', 'verify role no longer exists - contact an admin');
  }

  const botMember = i.guild.members.me;
  if (!botMember) {
    return replyEmbed(i, i.guildId!, 'error', 'bot member not found');
  }

  if (!botMember.permissions.has('ManageRoles')) {
    return replyEmbed(i, i.guildId!, 'error', 'bot lacks Manage Roles permission');
  }

  if (role.position >= botMember.roles.highest.position) {
    return replyEmbed(i, i.guildId!, 'error', 'verify role is higher than bot - contact an admin');
  }

  try {
    await member.roles.add(cfg.role_id);
    markVerified(i.guild.id, i.user.id);
    await replyEmbed(i, i.guildId!, 'success', '✅ verified! welcome in');
  } catch (err) {
    console.error('[verify]', err instanceof Error ? err.message : err);
    await replyEmbed(i, i.guildId!, 'error', 'failed to verify - check bot permissions');
  }
}

async function submitTicketPanel(i: ModalSubmitInteraction): Promise<void> {
  if (!i.channel) return;

  const title = i.fields.getTextInputValue('panel_title');
  const body = i.fields.getTextInputValue('panel_body');

  try {
    const channel = i.channel as TextChannel;
    const { embed, row, file } = ticketPanelEmbed(i.guildId!, title, body);
    
    await channel.send({ embeds: [embed], components: [row], files: [file] });
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', 'ticket panel posted')], flags: MessageFlags.Ephemeral });
  } catch (err) {
    console.error('[submitTicketPanel]', err instanceof Error ? err.message : err);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'failed to post ticket panel')], flags: MessageFlags.Ephemeral });
  }
}

async function submitAdCreate(i: ModalSubmitInteraction): Promise<void> {
  const name = i.fields.getTextInputValue('ad_name');
  const inviteLink = i.fields.getTextInputValue('ad_invite');

  try {
    const existing = ads.getAdByName(i.guildId!, name);
    if (existing) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', `ad with name "${name}" already exists (ID: ${existing.id})`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const adId = ads.createAd(i.guildId!, name, inviteLink, i.user.id);
    await i.reply({
      embeds: [brandEmbed(i.guildId!, 'success', `ad created with ID ${adId}. use \`/adspost ${adId}\` to post it`)],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('[submitAdCreate]', err instanceof Error ? err.message : err);
    await i.reply({
      embeds: [brandEmbed(i.guildId!, 'error', 'failed to create ad')],
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function submitAdEdit(i: ModalSubmitInteraction): Promise<void> {
  const adId = parseInt(i.customId.replace('adsedit_modal_', ''));
  const name = i.fields.getTextInputValue('ad_name');
  const inviteLink = i.fields.getTextInputValue('ad_invite');

  try {
    const success = ads.updateAd(i.guildId!, adId, name, inviteLink);
    if (!success) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'ad not found')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await i.reply({
      embeds: [brandEmbed(i.guildId!, 'success', `ad #${adId} updated`)],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('[submitAdEdit]', err instanceof Error ? err.message : err);
    await i.reply({
      embeds: [brandEmbed(i.guildId!, 'error', 'failed to update ad')],
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function colorRole(i: StringSelectMenuInteraction): Promise<void> {
  if (!i.guild || !i.member) return;
  const member = i.member as GuildMember;

  try {
    await clearColors(member);
    
    const picked = i.values[0];
    if (!picked) return replyEmbed(i, i.guildId!, 'info', 'color role removed');
    
    const role = i.guild.roles.cache.get(picked);
    if (!role) {
      return replyEmbed(i, i.guildId!, 'error', 'role no longer exists - contact an admin');
    }
    
    if (role.managed) {
      return replyEmbed(i, i.guildId!, 'error', 'i am unable to give managed roles');
    }
    
    const botMember = i.guild.members.me;
    if (!botMember) {
      return replyEmbed(i, i.guildId!, 'error', 'bot member not found');
    }
    
    if (!botMember.permissions.has('ManageRoles')) {
      return replyEmbed(i, i.guildId!, 'error', 'i am unable to manage roles - missing Manage Roles permission');
    }
    
    if (role.position >= botMember.roles.highest.position) {
      return replyEmbed(i, i.guildId!, 'error', 'role is higher than me - contact an admin');
    }
    
    await member.roles.add(picked);
    const colorRoles = guildConfig.getColorRoles(i.guildId!);
    const name = Object.entries(colorRoles).find(([_, id]) => id === picked)?.[0] ?? 'unknown';
    await replyEmbed(i, i.guildId!, 'success', `set to **${name}**`);
  } catch (err) {
    console.error('[colorRole]', err instanceof Error ? err.message : err);
    await replyEmbed(i, i.guildId!, 'error', 'failed to update role - check bot permissions');
  }
}

async function alertsRole(i: StringSelectMenuInteraction): Promise<void> {
  if (!i.guild || !i.member) return;
  await clearAlerts(i.member as GuildMember);
  await assignRoles(i, i.values, 'alert');
}

async function genderRole(i: StringSelectMenuInteraction): Promise<void> {
  if (!i.guild || !i.member) return;
  await clearGender(i.member as GuildMember);
  await assignRoles(i, i.values, 'gender');
}

async function ageRole(i: StringSelectMenuInteraction): Promise<void> {
  if (!i.guild || !i.member) return;
  await clearAge(i.member as GuildMember);
  await assignRoles(i, i.values, 'age');
}

async function assignRoles(i: StringSelectMenuInteraction, ids: string[], type: string): Promise<void> {
  if (!i.guild) return;
  const member = i.member as GuildMember;
  
  if (ids.length === 0) {
    return replyEmbed(i, i.guildId!, 'info', `${type} roles removed`);
  }
  
  const bot = i.guild.members.me;
  if (!bot || !bot.permissions.has('ManageRoles')) {
    return replyEmbed(i, i.guildId!, 'error', 'missing permissions');
  }
  
  const valid = ids.filter(id => {
    const role = i.guild!.roles.cache.get(id);
    return role && !role.managed && role.position < bot.roles.highest.position;
  });
  
  try {
    if (valid.length > 0) await member.roles.add(valid);
    const failed = ids.length - valid.length;
    
    if (valid.length === 0) {
      await replyEmbed(i, i.guildId!, 'error', 'could not add any roles');
    } else if (failed > 0) {
      await replyEmbed(i, i.guildId!, 'warn', `added ${valid.length}, ${failed} failed`);
    } else {
      await replyEmbed(i, i.guildId!, 'success', `added ${valid.length} ${type} role(s)`);
    }
  } catch (err) {
    console.error(`[${type}Role]`, err);
    await replyEmbed(i, i.guildId!, 'error', 'failed to update roles');
  }
}

async function clearRoles(member: GuildMember, roleIds: string[], label: string): Promise<void> {
  const current = member.roles.cache.filter(r => roleIds.includes(r.id) && member.guild.roles.cache.has(r.id));
  if (current.size > 0) {
    await member.roles.remove(current).catch(err => {
      console.error(`[clear${label}]`, err instanceof Error ? err.message : err);
    });
  }
}

async function clearColors(member: GuildMember): Promise<void> {
  const ids = Object.values(guildConfig.getColorRoles(member.guild.id)).filter(Boolean);
  await clearRoles(member, ids, 'Colors');
}

async function clearGender(member: GuildMember): Promise<void> {
  const ids = Object.values(guildConfig.getIdentityRolesByCategory(member.guild.id, 'gender')).filter(Boolean);
  await clearRoles(member, ids, 'Gender');
}

async function clearAge(member: GuildMember): Promise<void> {
  const ids = Object.values(guildConfig.getIdentityRolesByCategory(member.guild.id, 'age')).filter(Boolean);
  await clearRoles(member, ids, 'Age');
}

async function clearAlerts(member: GuildMember): Promise<void> {
  const ids = Object.values(guildConfig.getExtraRoles(member.guild.id)).filter(Boolean);
  await clearRoles(member, ids, 'Alerts');
}

async function replyEmbed(
  i: ButtonInteraction | StringSelectMenuInteraction,
  guildId: string,
  style: Parameters<typeof brandEmbed>[1],
  msg: string,
): Promise<void> {
  await i.reply({ embeds: [brandEmbed(guildId, style, msg)], flags: MessageFlags.Ephemeral });
}

async function createTicket(i: ButtonInteraction): Promise<void> {
  if (!i.guild) return;

  if (tickets.hasActiveTicket(i.guild.id, i.user.id)) {
    return replyEmbed(i, i.guildId!, 'warn', 'you already have an active ticket');
  }

  const config = guildConfig.getGuildConfig(i.guildId!);

  if (!config.ticketCategory) {
    return replyEmbed(i, i.guildId!, 'error', 'ticket category not configured');
  }

  const category = i.guild.channels.cache.get(config.ticketCategory);
  if (!category) {
    return replyEmbed(i, i.guildId!, 'error', 'ticket category not found');
  }

  await i.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    if (config.ticketMode === 'thread') {
      await createThreadTicket(i, category);
    } else {
      await createChannelTicket(i, category, config);
    }
  } catch (err) {
    console.error('[createTicket]', err instanceof Error ? err.message : err);
    const errorMsg = err instanceof Error && err.message.includes('Maximum number') 
      ? 'server has reached the maximum number of channels/threads'
      : 'failed to create ticket - check permissions';
    await i.editReply({ embeds: [brandEmbed(i.guildId!, 'error', errorMsg)] });
  }
}

function ticketWelcome(ticketNumber: number, userMention: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.pastel)
    .setTitle(`🎫 Ticket #${ticketNumber}`)
    .setDescription(
      `Welcome ${userMention}!\n\n` +
      `Please describe your suggestion or request below.\n` +
      `A staff member will review it shortly.\n\n` +
      `When you're done, click the button below to close this ticket.`
    )
    .setTimestamp();
}

async function createThreadTicket(i: ButtonInteraction, category: any): Promise<void> {
  if (category.type !== ChannelType.GuildText && category.type !== ChannelType.GuildForum) {
    return void await i.editReply({
      embeds: [brandEmbed(i.guildId!, 'error', 'thread tickets require a text channel or forum set as category')],
    });
  }

  const threadChannel = category as TextChannel;
  const perms = threadChannel.permissionsFor(i.client.user.id);
  
  if (!perms?.has([PermissionFlagsBits.CreatePrivateThreads, PermissionFlagsBits.SendMessages])) {
    return void await i.editReply({
      embeds: [brandEmbed(i.guildId!, 'error', 'bot lacks permissions to create private threads in that channel')],
    });
  }

  const thread = await threadChannel.threads.create({
    name: `ticket | ${i.user.username}`,
    reason: `Ticket created by ${i.user.tag}`,
    type: ChannelType.PrivateThread,
  });

  let ticketNumber: number;
  try {
    ticketNumber = tickets.createTicket(i.guild!.id, i.user.id, thread.id);
  } catch (err) {
    await thread.delete().catch(() => {});
    throw err;
  }
  
  await thread.edit({ name: `ticket-${ticketNumber} | ${i.user.username}` });
  await thread.members.add(i.user.id);
  await thread.send({ embeds: [ticketWelcome(ticketNumber, `${i.user}`)], components: [ticketCloseButton()] });
  await i.editReply({ embeds: [brandEmbed(i.guildId!, 'success', `ticket created: <#${thread.id}>`)] });
}

async function createChannelTicket(i: ButtonInteraction, category: any, config: any): Promise<void> {
  if (category.type !== ChannelType.GuildCategory) {
    return void await i.editReply({
      embeds: [brandEmbed(i.guildId!, 'error', 'ticket category must be a category channel')],
    });
  }

  const perms = i.guild!.members.me?.permissionsIn(category);
  if (!perms?.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.SendMessages])) {
    return void await i.editReply({
      embeds: [brandEmbed(i.guildId!, 'error', 'bot lacks permissions to create channels in that category')],
    });
  }

  const channel = await i.guild!.channels.create({
    name: `ticket-${i.user.username}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategory,
    permissionOverwrites: [
      { id: i.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: i.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ],
  });

  let ticketNumber: number;
  try {
    ticketNumber = tickets.createTicket(i.guild!.id, i.user.id, channel.id);
  } catch (err) {
    await channel.delete().catch(() => {});
    throw err;
  }

  await channel.send({ embeds: [ticketWelcome(ticketNumber, `${i.user}`)], components: [ticketCloseButton()] });
  await i.editReply({ embeds: [brandEmbed(i.guildId!, 'success', `ticket created: ${channel}`)] });
}

async function closeTicket(i: ButtonInteraction): Promise<void> {
  if (!i.guild || !i.channel) return;

  const ticket = tickets.getTicket(i.channel.id);
  if (!ticket) {
    return replyEmbed(i, i.guildId!, 'error', 'this is not a ticket channel');
  }

  await i.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const channel = i.channel as TextChannel | PublicThreadChannel;
    await i.editReply({ embeds: [brandEmbed(i.guildId!, 'info', '⏳ generating transcript...')] });
    
    const transcriptFile = await generateTranscript(channel, ticket.ticketNumber, i.guildId!);
    await sendTranscript(i.guild, channel, ticket, transcriptFile);
    await notifyClose(channel, i);
    tickets.deleteTicket(i.channel.id);
    await scheduleDelete(channel);
  } catch (err) {
    console.error('[closeTicket]', err instanceof Error ? err.message : err);
    await i.editReply({ embeds: [brandEmbed(i.guildId!, 'error', 'failed to close ticket')] });
  }
}

function transcriptEmbed(ticketNumber: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.pastel)
    .setTitle(`🎫 Ticket #${ticketNumber} Transcript`)
    .setDescription(`Your ticket has been closed.\nHere's a transcript of the conversation.`)
    .setTimestamp();
}

async function sendTranscript(guild: any, channel: any, ticket: any, file: any): Promise<void> {
  try {
    const creator = await guild.members.fetch(ticket.userId);
    await creator.send({ embeds: [transcriptEmbed(ticket.ticketNumber)], files: [file] });
  } catch {
    await channel.send({ content: `<@${ticket.userId}> - Your ticket transcript (DMs are closed):`, files: [file] });
  }
}

async function notifyClose(channel: any, i: ButtonInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(COLORS.pastel)
    .setTitle('🔒 Ticket Closed')
    .setDescription(
      `This ticket has been closed by ${i.user}.\n` +
      `Transcript has been sent.\n` +
      `${channel.isThread() ? 'Thread' : 'Channel'} will be deleted in 10 seconds.`
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  await i.editReply({ embeds: [brandEmbed(i.guildId!, 'success', 'ticket closed - transcript sent')] });
}

async function scheduleDelete(channel: any): Promise<void> {
  setTimeout(async () => {
    try {
      if (channel.isThread()) {
        await channel.setArchived(true);
        await channel.setLocked(true);
      } else {
        await channel.delete();
      }
    } catch (err) {
      console.error('[scheduleDelete]', err instanceof Error ? err.message : err);
    }
  }, 10000);
}

async function routeLfg(i: ButtonInteraction): Promise<void> {
  await routeButton(i, lfgButton(i.customId, i.user.id, i.message.id));
}

async function routeGiveaway(i: ButtonInteraction): Promise<void> {
  await routeButton(i, giveawayButton(i.customId, i.user.id, i.message.id));
}

type ButtonResult = { embed?: EmbedBuilder; row?: any; reply?: { style: 'success' | 'error' | 'warn'; text: string }; end?: EmbedBuilder } | null;

async function routeButton(i: ButtonInteraction, result: ButtonResult): Promise<void> {
  if (!result) return;

  if (result.end) {
    await i.update({ embeds: [result.end], components: [], attachments: [] });
    return;
  }

  if (result.embed && result.row) {
    await i.update({ embeds: [result.embed], components: [result.row] });
  }

  if (result.reply) {
    const fn = i.replied || i.deferred ? i.followUp.bind(i) : i.reply.bind(i);
    await fn({ embeds: [brandEmbed(i.guildId!, result.reply.style, result.reply.text)], flags: MessageFlags.Ephemeral });
  }
}

async function handleVoiceButton(i: ButtonInteraction): Promise<void> {
  const [_, action, channelId] = i.customId.split('_');
  const member = i.member as GuildMember;
  
  if (!member.voice.channel || member.voice.channel.id !== channelId) {
    return replyEmbed(i, i.guildId!, 'error', 'you must be in this voice channel');
  }
  
  const channel = member.voice.channel as VoiceChannel;
  let vc = voice.getVoiceChannel(i.guildId!, channelId);
  
  if (!vc) {
    voice.setVoiceOwner(i.guildId!, channelId, i.user.id);
    vc = voice.getVoiceChannel(i.guildId!, channelId);
  }
  
  const isMod = isStaff(member);
  const isOwner = vc!.ownerId === i.user.id;
  
  if (!isOwner && !isMod && action !== 'claim') {
    return replyEmbed(i, i.guildId!, 'error', 'only the channel owner or staff can use this');
  }
  
  switch (action) {
    case 'lock':
      await channel.permissionOverwrites.edit(i.guild!.roles.everyone, { Connect: false });
      voice.setVoiceLocked(i.guildId!, channelId, true);
      await replyEmbed(i, i.guildId!, 'success', `locked ${channel.name}`);
      break;
      
    case 'unlock':
      await channel.permissionOverwrites.edit(i.guild!.roles.everyone, { Connect: null });
      voice.setVoiceLocked(i.guildId!, channelId, false);
      await replyEmbed(i, i.guildId!, 'success', `unlocked ${channel.name}`);
      break;
      
    case 'claim':
      const owner = await i.guild!.members.fetch(vc!.ownerId).catch(() => null);
      const ownerInVc = owner?.voice.channel?.id === channelId;
      
      if (ownerInVc) {
        return replyEmbed(i, i.guildId!, 'error', 'the owner is still in the channel');
      }
      
      voice.setVoiceOwner(i.guildId!, channelId, i.user.id);
      await replyEmbed(i, i.guildId!, 'success', 'you now own this voice channel');
      break;
  }
}

async function handleVoiceAction(i: StringSelectMenuInteraction): Promise<void> {
  const channelId = i.customId.split('_')[2];
  const action = i.values[0];
  const member = i.member as GuildMember;
  
  if (!member.voice.channel || member.voice.channel.id !== channelId) {
    return replyEmbed(i, i.guildId!, 'error', 'you must be in this voice channel');
  }
  
  let vc = voice.getVoiceChannel(i.guildId!, channelId);
  
  if (!vc) {
    voice.setVoiceOwner(i.guildId!, channelId, i.user.id);
    vc = voice.getVoiceChannel(i.guildId!, channelId);
  }
  
  const isMod = isStaff(member);
  const isOwner = vc!.ownerId === i.user.id;
  
  if (!isOwner && !isMod) {
    return replyEmbed(i, i.guildId!, 'error', 'only the channel owner or staff can use this');
  }
  
  switch (action) {
    case 'limit':
      const limitModal = new ModalBuilder()
        .setCustomId(`vc_limit_${channelId}`)
        .setTitle('Set User Limit')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('limit')
              .setLabel('User Limit (0-99, 0 = unlimited)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMinLength(1)
              .setMaxLength(2)
          )
        );
      await i.showModal(limitModal);
      break;
      
    case 'rename':
      const renameModal = new ModalBuilder()
        .setCustomId(`vc_rename_${channelId}`)
        .setTitle('Rename Channel')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('name')
              .setLabel('New Channel Name')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(100)
          )
        );
      await i.showModal(renameModal);
      break;
      
    case 'kick':
    case 'permit':
    case 'reject':
    case 'transfer':
      await i.reply({
        embeds: [brandEmbed(i.guildId!, 'info', `use \`/voice ${action}\` command for this action`)],
        flags: MessageFlags.Ephemeral,
      });
      break;
  }
}

export async function onVoiceModal(i: ModalSubmitInteraction): Promise<void> {
  const [_, action, channelId] = i.customId.split('_');
  const member = i.member as GuildMember;
  
  if (!member.voice.channel || member.voice.channel.id !== channelId) {
    return void await i.reply({
      embeds: [brandEmbed(i.guildId!, 'error', 'you must be in this voice channel')],
      flags: MessageFlags.Ephemeral,
    });
  }
  
  const vcChannel = member.voice.channel as VoiceChannel;
  
  switch (action) {
    case 'limit':
      const limitStr = i.fields.getTextInputValue('limit');
      const limit = parseInt(limitStr, 10);
      
      if (isNaN(limit) || limit < 0 || limit > 99) {
        return void await i.reply({
          embeds: [brandEmbed(i.guildId!, 'error', 'limit must be 0-99')],
          flags: MessageFlags.Ephemeral,
        });
      }
      
      await vcChannel.setUserLimit(limit);
      await i.reply({
        embeds: [brandEmbed(i.guildId!, 'success', limit === 0 ? 'removed user limit' : `set limit to **${limit}**`)],
        flags: MessageFlags.Ephemeral,
      });
      break;
      
    case 'rename':
      const name = i.fields.getTextInputValue('name');
      await vcChannel.setName(name);
      await i.reply({
        embeds: [brandEmbed(i.guildId!, 'success', `renamed to **${name}**`)],
        flags: MessageFlags.Ephemeral,
      });
      break;
  }
}
