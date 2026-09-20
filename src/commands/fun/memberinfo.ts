import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  GuildMember,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS } from '../../config';
import { asset } from '../../services/embeds';
import { getBrand } from '../../data/brand';

const MS_PER_DAY = 86_400_000;

function memberEmbed(guildId: string, member: GuildMember): { embed: EmbedBuilder; file?: AttachmentBuilder } {
  const user = member.user;
  const created = Math.floor(user.createdTimestamp / 1_000);
  const joined = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1_000) : null;
  const roles = member.roles.cache
    .filter(r => r.id !== member.guild.id)
    .sort((a, b) => b.position - a.position)
    .map(r => r.toString());

  const boostingSince = member.premiumSinceTimestamp
    ? `<t:${Math.floor(member.premiumSinceTimestamp / 1_000)}:R>`
    : 'not boosting';

  const daysSinceJoin = joined
    ? Math.floor((Date.now() - joined * 1_000) / MS_PER_DAY)
    : '??';

  const status = presenceStatus(member);

  const bannerURL = user.bannerURL({ size: 1024 });
  const imageURL = bannerURL ?? 'attachment://member_info.png';
  const file = bannerURL ? undefined : asset('member_info.png');

  const embed = new EmbedBuilder()
    .setColor(member.displayHexColor === '#000000' ? COLORS.brand : member.displayColor)
    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .setImage(imageURL)
    .addFields(
      { name: ' display name', value: member.displayName, inline: true },
      { name: ' id', value: user.id, inline: true },
      { name: ' status', value: status, inline: true },
      { name: ' account created', value: `<t:${created}:D> (<t:${created}:R>)`, inline: false },
      { name: ' joined server', value: joined ? `<t:${joined}:D> (<t:${joined}:R>) - ${daysSinceJoin}d ago` : 'unknown', inline: false },
      { name: ' boosting', value: boostingSince, inline: true },
      { name: ' role color', value: member.displayHexColor, inline: true },
      { name: ` roles (${roles.length})`, value: roles.length > 0 ? roles.join(', ') : 'none', inline: false },
    )
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();

  return { embed, file };
}

function presenceStatus(member: GuildMember): string {
  const p = member.presence;
  if (!p) return '⚫ offline';
  const map: Record<string, string> = {
    online: '🟢 online',
    idle: '🌙 idle',
    dnd: '🔴 do not disturb',
    offline: '⚫ offline',
    invisible: '⚫ invisible',
  };
  return map[p.status] ?? '⚫ offline';
}

const cmd: Command = {
  name: 'memberinfo',
  aliases: ['mi', 'userinfo', 'ui', 'whois'],
  description: 'view info about a member',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('memberinfo')
    .setDescription('view info about a member')
    .addUserOption(o => o.setName('user').setDescription('who to look up (default: you)')),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null ?? i.member as GuildMember;
    const { embed, file } = memberEmbed(i.guildId!, target);
    await i.reply({ embeds: [embed], files: file ? [file] : [] });
  },

  async prefix(msg: Message) {
    const target = (msg.mentions.members?.first() ?? msg.member) as GuildMember;
    const { embed, file } = memberEmbed(msg.guildId!, target);
    await msg.reply({ embeds: [embed], files: file ? [file] : [] });
  },
};

export default cmd;
