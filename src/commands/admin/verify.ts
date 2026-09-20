import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel, ChannelType, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, verifyEmbed } from '../../services/embeds';
import { setConfig } from '../../data/verify';

const cmd: Command = {
  name: 'verify',
  aliases: ['setupverify'],
  description: 'set up the verification system',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('set up the verification system')
    .addRoleOption(o => o.setName('role').setDescription('verified role to give').setRequired(true))
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('channel to post in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  
  async run(i: ChatInputCommandInteraction) {
    const role = i.options.getRole('role', true);
    const channel = i.options.getChannel('channel', true) as TextChannel;
    const { embed, row, files } = verifyEmbed(i.guildId!);
    const sent = await channel.send({ embeds: [embed], components: [row], files });
    setConfig(i.guildId!, role.id, channel.id, sent.id);
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `verification set up in ${channel}`)], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message, _args: string[]) {
    const role = msg.mentions.roles.first();
    const channel = msg.mentions.channels.first() as TextChannel | undefined;
    if (!role || !channel) return void await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'usage: .verify @role #channel')] });
    const { embed, row, files } = verifyEmbed(msg.guildId!);
    const sent = await channel.send({ embeds: [embed], components: [row], files });
    setConfig(msg.guildId!, role.id, channel.id, sent.id);
    const reply = await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'success', `verification set up in ${channel}`)] });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
  },
};

export default cmd;
