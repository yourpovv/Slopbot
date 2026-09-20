import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { setBrand } from '../../data/brand';
import { brandEmbed } from '../../services/embeds';

const cmd: Command = {
  name: 'brand',
  aliases: [],
  description: 'set bot brand name (owner only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('brand')
    .setDescription('set server brand name (owner only)')
    .addStringOption(o => o.setName('name').setDescription('brand name').setRequired(true)),
  
  async run(i: ChatInputCommandInteraction) {
    if (i.user.id !== i.guild?.ownerId) {
      return void await i.reply({ embeds: [brandEmbed(i.guildId!, 'error', 'owner only')], flags: MessageFlags.Ephemeral });
    }
    
    const brandName = i.options.getString('name', true);
    setBrand(i.guildId!, brandName);
    
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', `brand set to: ${brandName}`)], flags: MessageFlags.Ephemeral });
  },
  
  async prefix(msg: Message, args: string[]) {
    if (msg.author.id !== msg.guild?.ownerId) return;
    
    if (args.length === 0) return;
    
    const brandName = args.join(' ');
    setBrand(msg.guild.id, brandName);
    
    await msg.delete().catch(() => {});
    
    const channel = msg.channel as TextChannel;
    const reply = await channel.send(`brand set to: ${brandName}`);
    setTimeout(() => reply.delete().catch(() => {}), 3000);
  },
};

export default cmd;