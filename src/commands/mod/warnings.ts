import { SlashCommandBuilder, ChatInputCommandInteraction, Message, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as warns from '../../data/warns';

const cmd: Command = {
  name: 'warnings',
  aliases: ['warns', 'infractions'],
  description: 'view warnings for a member',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('view warnings for a member')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    if (!target) return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'user not found')], flags: MessageFlags.Ephemeral });

    const list = warns.list(i.guildId!, target.id);
    await i.reply({ embeds: [formatWarns(i.guildId!, target, list)] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'mention someone')] });

    const list = warns.list(msg.guildId!, target.id);
    await msg.reply({ embeds: [formatWarns(msg.guildId!, target, list)] });
  },
};

function formatWarns(guildId: string, target: GuildMember, list: ReturnType<typeof warns.list>) {
  if (list.length === 0) return brandEmbed(guildId, 'info', `**${target.user.tag}** has no warnings`);

  const lines = list.map((w, i) =>
    `\` ${i + 1} \` ${w.reason} - <@${w.modId}>`
  ).join('\n');

  return brandEmbed(guildId, 'warn', `**${target.user.tag}** - ${list.length} warnings\n\n${lines}`);
}

export default cmd;
