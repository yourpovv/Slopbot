import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, GuildMember, VoiceChannel, ChannelType, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, TextChannel } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as voice from '../../data/voice';
import { isStaff } from '../../services/permissions';
import { COLORS } from '../../config';
import { getBrand } from '../../data/brand';

function isInVoice(member: GuildMember): VoiceChannel | null {
  if (!member.voice.channel || member.voice.channel.type !== ChannelType.GuildVoice) return null;
  return member.voice.channel as VoiceChannel;
}

function isOwner(vc: voice.VoiceChannel, userId: string): boolean {
  return vc.ownerId === userId;
}

const cmd: Command = {
  name: 'voice',
  aliases: ['vc'],
  description: 'manage voice channels',
  cooldown: 3,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('manage voice channels')
    .addSubcommand(sub =>
      sub.setName('lock').setDescription('lock current voice channel')
    )
    .addSubcommand(sub =>
      sub.setName('unlock').setDescription('unlock current voice channel')
    )
    .addSubcommand(sub =>
      sub
        .setName('limit')
        .setDescription('set user limit')
        .addIntegerOption(o =>
          o.setName('count').setDescription('user limit (0 = unlimited)').setRequired(true).setMinValue(0).setMaxValue(99)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('rename current voice channel')
        .addStringOption(o =>
          o.setName('name').setDescription('new name').setRequired(true).setMaxLength(100)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('kick')
        .setDescription('kick user from voice')
        .addUserOption(o =>
          o.setName('user').setDescription('user to kick').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('claim').setDescription('claim ownership if owner left')
    )
    .addSubcommand(sub =>
      sub
        .setName('permit')
        .setDescription('allow specific user in locked vc')
        .addUserOption(o =>
          o.setName('user').setDescription('user to allow').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reject')
        .setDescription('remove permit from user')
        .addUserOption(o =>
          o.setName('user').setDescription('user to remove').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('transfer')
        .setDescription('transfer ownership to another user')
        .addUserOption(o =>
          o.setName('user').setDescription('new owner').setRequired(true)
        )
    ),

  async run(i: ChatInputCommandInteraction) {
    const member = i.member as GuildMember;
    const channel = isInVoice(member);
    
    if (!channel) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'you must be in a voice channel')],
        flags: MessageFlags.Ephemeral,
      });
    }
    
    const sub = i.options.getSubcommand();
    let vc = voice.getVoiceChannel(i.guildId!, channel.id);
    
    if (!vc && sub !== 'claim') {
      voice.setVoiceOwner(i.guildId!, channel.id, i.user.id);
      vc = voice.getVoiceChannel(i.guildId!, channel.id);
    }
    
    const isMod = isStaff(member);
    const isVcOwner = vc ? isOwner(vc, i.user.id) : true;
    
    if (!isVcOwner && !isMod && sub !== 'claim') {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only the channel owner or staff can use this')],
        flags: MessageFlags.Ephemeral,
      });
    }

    switch (sub) {
      case 'lock': {
        await channel.permissionOverwrites.edit(i.guild!.roles.everyone, { Connect: false });
        voice.setVoiceLocked(i.guildId!, channel.id, true);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `locked ${channel.name}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'unlock': {
        await channel.permissionOverwrites.edit(i.guild!.roles.everyone, { Connect: null });
        voice.setVoiceLocked(i.guildId!, channel.id, false);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `unlocked ${channel.name}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'limit': {
        const count = i.options.getInteger('count', true);
        await channel.setUserLimit(count);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', count === 0 ? 'removed user limit' : `set limit to **${count}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'rename': {
        const name = i.options.getString('name', true);
        await channel.setName(name);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `renamed to **${name}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'kick': {
        const target = i.options.getMember('user') as GuildMember | null;
        if (!target) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'user not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        if (!target.voice.channel || target.voice.channel.id !== channel.id) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'user is not in this voice channel')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        await target.voice.disconnect('kicked by vc owner');
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `kicked ${target.user.tag}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'claim': {
        if (!vc) {
          voice.setVoiceOwner(i.guildId!, channel.id, i.user.id);
          await i.reply({
            embeds: [brandEmbed(i.guildId!, 'success', 'you now own this voice channel')],
            flags: MessageFlags.Ephemeral,
          });
          break;
        }
        
        const owner = await i.guild!.members.fetch(vc.ownerId).catch(() => null);
        const ownerInVc = owner?.voice.channel?.id === channel.id;
        
        if (ownerInVc) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'the owner is still in the channel')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        voice.setVoiceOwner(i.guildId!, channel.id, i.user.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', 'you now own this voice channel')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'permit': {
        const target = i.options.getUser('user', true);
        voice.addVoicePermit(i.guildId!, channel.id, target.id);
        
        await channel.permissionOverwrites.edit(target.id, { Connect: true });
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `${target.tag} can now join`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'reject': {
        const target = i.options.getUser('user', true);
        voice.removeVoicePermit(i.guildId!, channel.id, target.id);
        
        await channel.permissionOverwrites.delete(target.id);
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `removed ${target.tag}'s permit`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'transfer': {
        const target = i.options.getMember('user') as GuildMember | null;
        if (!target) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'user not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        if (!target.voice.channel || target.voice.channel.id !== channel.id) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'user must be in this voice channel')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        voice.setVoiceOwner(i.guildId!, channel.id, target.id);
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `transferred ownership to ${target.user.tag}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
    }
  },

  async prefix(msg: Message) {
    const member = msg.member as GuildMember;
    const channel = isInVoice(member);
    
    if (!channel) {
      return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'you must be in a voice channel')] });
    }
    
    let vc = voice.getVoiceChannel(msg.guildId!, channel.id);
    
    if (!vc) {
      voice.setVoiceOwner(msg.guildId!, channel.id, msg.author.id);
      vc = voice.getVoiceChannel(msg.guildId!, channel.id);
    }
    
    const owner = await msg.guild!.members.fetch(vc!.ownerId).catch(() => null);
    const ownerTag = owner ? owner.user.tag : 'Unknown';
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.brand)
      .setTitle(`🎙️ ${channel.name}`)
      .setDescription(
        `**owner:** ${owner ? `<@${owner.id}>` : ownerTag}\n` +
        `**status:** ${vc!.locked ? '🔒 locked' : '🔓 unlocked'}\n` +
        `**limit:** ${channel.userLimit === 0 ? 'unlimited' : channel.userLimit}\n` +
        `**members:** ${channel.members.size}`
      )
      .setFooter({ text: getBrand(msg.guildId!) })
      .setTimestamp();
    
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`vc_lock_${channel.id}`)
        .setLabel('Lock')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`vc_unlock_${channel.id}`)
        .setLabel('Unlock')
        .setEmoji('🔓')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`vc_claim_${channel.id}`)
        .setLabel('Claim')
        .setEmoji('👑')
        .setStyle(ButtonStyle.Primary)
    );
    
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`vc_action_${channel.id}`)
        .setPlaceholder('Select action...')
        .addOptions(
          { label: 'Set Limit', value: 'limit', emoji: '👥' },
          { label: 'Rename', value: 'rename', emoji: '✏️' },
          { label: 'Kick User', value: 'kick', emoji: '👢' },
          { label: 'Permit User', value: 'permit', emoji: '✅' },
          { label: 'Reject User', value: 'reject', emoji: '❌' },
          { label: 'Transfer Ownership', value: 'transfer', emoji: '👑' }
        )
    );
    
    if (msg.channel instanceof TextChannel) {
      await msg.channel.send({ embeds: [embed], components: [row1, row2] });
    }
  },
};

export default cmd;
