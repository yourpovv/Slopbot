import { MessageReaction, User, TextChannel, EmbedBuilder, PartialMessageReaction, PartialUser } from 'discord.js';
import * as starboard from '../data/starboard';
import { COLORS } from '../config';

export async function onReactionAdd(reaction: MessageReaction | PartialMessageReaction, _user: User | PartialUser): Promise<void> {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  
  if (!reaction.message.guild) return;
  
  const config = starboard.getStarboardConfig(reaction.message.guildId!);
  if (!config) return;
  
  if (reaction.emoji.name !== config.emoji && reaction.emoji.toString() !== config.emoji) return;
  
  await update(reaction as MessageReaction, config);
}

export async function onReactionRemove(reaction: MessageReaction | PartialMessageReaction, _user: User | PartialUser): Promise<void> {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  
  if (!reaction.message.guild) return;
  
  const config = starboard.getStarboardConfig(reaction.message.guildId!);
  if (!config) return;
  
  if (reaction.emoji.name !== config.emoji && reaction.emoji.toString() !== config.emoji) return;
  
  await update(reaction as MessageReaction, config);
}

async function update(reaction: MessageReaction, config: starboard.StarboardConfig): Promise<void> {
  const { message } = reaction;
  const guildId = message.guildId!;
  
  if (starboard.isIgnored(guildId, message.channelId)) return;
  if (!message.author || starboard.isIgnored(guildId, message.author.id)) return;
  
  if (message.author.bot) return;
  
  const member = message.member;
  if (member) {
    const roles = member.roles.cache;
    for (const [roleId] of roles) {
      if (starboard.isIgnored(guildId, roleId)) return;
    }
  }
  
  let starCount = reaction.count ?? 0;
  
  if (!config.allowSelf && message.author) {
    const users = await reaction.users.fetch();
    if (users.has(message.author.id)) {
      starCount = Math.max(0, starCount - 1);
    }
  }
  
  const existing = starboard.getStarboardMessage(guildId, message.id);
  
  if (starCount < config.starsNeeded) {
    if (existing?.starboardMessageId) {
      await removeFromStarboard(guildId, config.channelId, existing.starboardMessageId, message.id);
    }
    return;
  }
  
  if (existing?.starboardMessageId) {
    await updateStarboard(guildId, config.channelId, existing.starboardMessageId, message, starCount, config.emoji);
  } else {
    await postToStarboard(guildId, config.channelId, message, starCount, config.emoji);
  }
}

async function postToStarboard(guildId: string, channelId: string, message: MessageReaction['message'], stars: number, emoji: string): Promise<void> {
  const channel = await message.guild?.channels.fetch(channelId).catch(() => null);
  if (!channel || !(channel instanceof TextChannel)) return;
  
  const embed = await createEmbed(message, stars, emoji);
  const sent = await channel.send({ embeds: [embed] }).catch(() => null);
  
  if (sent) {
    starboard.saveStarboardMessage(guildId, message.id, sent.id, stars);
  }
}

async function updateStarboard(guildId: string, channelId: string, starboardMessageId: string, message: MessageReaction['message'], stars: number, emoji: string): Promise<void> {
  const channel = await message.guild?.channels.fetch(channelId).catch(() => null);
  if (!channel || !(channel instanceof TextChannel)) return;
  
  const starboardMsg = await channel.messages.fetch(starboardMessageId).catch(() => null);
  if (!starboardMsg) return;
  
  const embed = await createEmbed(message, stars, emoji);
  await starboardMsg.edit({ embeds: [embed] }).catch(() => {});
  
  starboard.updateStarCount(guildId, message.id, stars);
}

async function removeFromStarboard(guildId: string, channelId: string, starboardMessageId: string, messageId: string): Promise<void> {
  const guild = await (global as any).client?.guilds.fetch(guildId).catch(() => null);
  if (!guild) return;
  
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !(channel instanceof TextChannel)) return;
  
  const starboardMsg = await channel.messages.fetch(starboardMessageId).catch(() => null);
  if (starboardMsg) {
    await starboardMsg.delete().catch(() => {});
  }
  
  starboard.deleteStarboardMessage(guildId, messageId);
}

async function createEmbed(message: MessageReaction['message'], stars: number, emoji: string): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setColor(COLORS.brand)
    .setAuthor({ name: message.author?.tag ?? 'Unknown', iconURL: message.author?.displayAvatarURL() })
    .setDescription(message.content || '*no text content*')
    .addFields({ name: 'Source', value: `[jump to message](${message.url})` })
    .setTimestamp(message.createdAt)
    .setFooter({ text: `${emoji} ${stars}` });
  
  const attachment = message.attachments.first();
  if (attachment && attachment.contentType?.startsWith('image/')) {
    embed.setImage(attachment.url);
  }
  
  return embed;
}
