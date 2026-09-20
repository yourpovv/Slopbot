import { Message, TextChannel } from 'discord.js';
import * as leveling from '../data/leveling';
import { brandEmbed } from './embeds';

export async function processMessage(msg: Message): Promise<void> {
  if (!msg.guild || msg.author.bot) return;
  
  const config = leveling.getLevelingConfig(msg.guildId!);
  if (!config.enabled) return;
  
  const canGain = leveling.canGainXp(msg.guildId!, msg.author.id, config);
  if (!canGain) return;
  
  const xpGain = Math.floor(config.xpPerMessage * config.xpMultiplier);
  const result = leveling.addXp(msg.guildId!, msg.author.id, xpGain);
  
  if (result.leveled) {
    await announceLevel(msg, result.newLevel, config);
    await grantRewards(msg, result.newLevel);
  }
}

async function announceLevel(msg: Message, level: number, config: leveling.LevelingConfig): Promise<void> {
  const text = `${msg.author} leveled up to **Level ${level}**! 🎉`;
  
  if (config.dmEnabled) {
    await msg.author.send({ embeds: [brandEmbed(msg.guildId!, 'success', text)] }).catch(() => {});
  }
  
  if (config.announceChannelId) {
    const channel = await msg.guild!.channels.fetch(config.announceChannelId).catch(() => null);
    if (channel instanceof TextChannel) {
      await channel.send({ embeds: [brandEmbed(msg.guildId!, 'success', text)] }).catch(() => {});
    }
  } else if (!config.dmEnabled && msg.channel instanceof TextChannel) {
    await msg.channel.send({ embeds: [brandEmbed(msg.guildId!, 'success', text)] }).catch(() => {});
  }
}

async function grantRewards(msg: Message, level: number): Promise<void> {
  const rewards = leveling.getLevelRewards(msg.guildId!);
  const roleId = rewards[level];
  
  if (!roleId) return;
  
  const member = msg.member;
  if (!member) return;
  
  const role = await msg.guild!.roles.fetch(roleId).catch(() => null);
  if (!role) return;
  
  await member.roles.add(role).catch(() => {});
}
