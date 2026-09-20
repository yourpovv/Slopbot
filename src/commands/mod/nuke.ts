import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits, ChannelType, TextChannel, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';

const cmd: Command = {
  name: 'nuke',
  aliases: [],
  description: 'delete and recreate this channel',
  cooldown: 0,
  permissions: [PermissionFlagsBits.Administrator],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('delete and recreate this channel')
    .addStringOption(o => o.setName('message').setDescription('message to send after nuke')),

  async run(i: ChatInputCommandInteraction) {
    const channel = i.channel as TextChannel;
    const message = i.options.getString('message');
    
    if (!channel || channel.type !== ChannelType.GuildText) {
      return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'can only nuke text channels')], flags: MessageFlags.Ephemeral });
    }
    
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'info', 'nuking channel...')], flags: MessageFlags.Ephemeral });
    
    const position = channel.position;
    const parent = channel.parent;
    const topic = channel.topic;
    const nsfw = channel.nsfw;
    const rateLimitPerUser = channel.rateLimitPerUser;
    const permissions = channel.permissionOverwrites.cache.map(p => ({
      id: p.id,
      allow: p.allow.bitfield,
      deny: p.deny.bitfield,
      type: p.type,
    }));
    const name = channel.name;
    
    const newChannel = await channel.clone({
      name,
      topic: topic ?? undefined,
      nsfw,
      rateLimitPerUser,
      parent: parent ?? undefined,
      position,
      permissionOverwrites: permissions,
      reason: `Channel nuked by ${i.user.tag}`,
    });
    
    await channel.delete();
    
    if (message) {
      await newChannel.send(message);
    }
  },

  async prefix(msg: Message, args: string[]) {
    const channel = msg.channel as TextChannel;
    const message = args.join(' ');
    
    if (channel.type !== ChannelType.GuildText) {
      return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'can only nuke text channels')] });
    }
    
    const position = channel.position;
    const parent = channel.parent;
    const topic = channel.topic;
    const nsfw = channel.nsfw;
    const rateLimitPerUser = channel.rateLimitPerUser;
    const permissions = channel.permissionOverwrites.cache.map(p => ({
      id: p.id,
      allow: p.allow.bitfield,
      deny: p.deny.bitfield,
      type: p.type,
    }));
    const name = channel.name;
    
    const newChannel = await channel.clone({
      name,
      topic: topic ?? undefined,
      nsfw,
      rateLimitPerUser,
      parent: parent ?? undefined,
      position,
      permissionOverwrites: permissions,
      reason: `Channel nuked by ${msg.author.tag}`,
    });
    
    await channel.delete();
    
    if (message) {
      await newChannel.send(message);
    }
  },
};

export default cmd;
