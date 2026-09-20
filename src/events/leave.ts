import { GuildMember } from 'discord.js';
import { brandEmbed, asset } from '../services/embeds';

export default {
  name: 'guildMemberRemove',
  once: false,
  async run(member: GuildMember): Promise<void> {
    const channel = member.guild.systemChannel;
    if (!channel) return;

    const embed = brandEmbed(member.guild.id, 'default', `**${member.user.tag}** left the server`)
      .setImage('attachment://has_left.png');

    const file = asset('has_left.png');
    await channel.send({ embeds: [embed], files: [file] });
  },
};
