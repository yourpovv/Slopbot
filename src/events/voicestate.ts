import { VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';
import * as voice from '../data/voice';

export default {
  name: 'voiceStateUpdate',
  once: false,
  async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const guildId = newState.guild.id;
    const config = voice.getJoinToCreateConfig(guildId);
    
    if (!config) return;
    
    // we joined the join-to-create channel
    if (newState.channelId === config.channelId && !oldState.channelId) {
      const member = newState.member;
      if (!member) return;
      
      const channelName = config.channelName.replace('{user}', member.displayName);
      
      try {
        const newChannel = await newState.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: config.categoryId,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.ManageChannels,
              ],
            },
          ],
        });
        
        voice.addTempVoiceChannel(guildId, newChannel.id);
        voice.setVoiceOwner(guildId, newChannel.id, member.id);
        
        await member.voice.setChannel(newChannel);
      } catch (err) {
        console.error('[voice join-to-create]', err);
      }
    }
    
    // check if a temp channel is empty
    if (oldState.channelId && voice.isTempVoiceChannel(guildId, oldState.channelId)) {
      const channel = oldState.channel;
      if (channel && channel.members.size === 0) {
        try {
          await channel.delete();
          voice.removeTempVoiceChannel(guildId, oldState.channelId);
          voice.removeVoiceChannel(guildId, oldState.channelId);
        } catch (err) {
          console.error('[voice cleanup]', err);
        }
      }
    }
  },
};
