import { SlashCommandBuilder, ChatInputCommandInteraction, Message, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import { canNick } from './nickcheck';

const NICK_LIMIT = 32;

const cmd: Command = {
  name: 'forcenick',
  aliases: ['fn'],
  description: 'force a nickname on someone',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('forcenick')
    .setDescription('force a nickname on someone')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('name').setDescription('new nickname').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const name = i.options.getString('name', true).slice(0, NICK_LIMIT);
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });
    const err = canNick(target.guild, target);
    if (err) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', err)], flags: MessageFlags.Ephemeral });
    await target.setNickname(name);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `set ${target}'s nickname to **${name}**`)] });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });
    const err = canNick(target.guild, target);
    if (err) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', err)] });
    const name = args.slice(1).join(' ').slice(0, NICK_LIMIT);
    if (!name) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'provide a name')] });
    await target.setNickname(name);
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'success', `set ${target}'s nickname to **${name}**`)] });
  },
};

export default cmd;
