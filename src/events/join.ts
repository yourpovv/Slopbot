import { GuildMember } from 'discord.js';
import { brandEmbed, asset } from '../services/embeds';

export default {
  name: 'guildMemberAdd',
  once: false,
  async run(member: GuildMember): Promise<void> {
    const channel = member.guild.systemChannel;
    if (!channel) return;

    const embed = brandEmbed(member.guild.id, 'info',
      `welcome to **${member.guild.name}**, ${member}! make sure to read the rules and verify`
    ).setImage('attachment://has_joined.png');

    const file = asset('has_joined.png');
    await channel.send({ embeds: [embed], files: [file] });
  },
};
