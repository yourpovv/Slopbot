import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, colorRolesMenu } from '../../services/embeds';
import { COLOR_ROLES } from '../../config';

const cmd: Command = {
  name: 'colorroles',
  aliases: ['colorpicker', 'pickcolor'],
  description: 'send the color role picker',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('colorroles')
    .setDescription('send the color role picker'),

  async run(i: ChatInputCommandInteraction) {
    const { embed, row, file } = colorRolesMenu(i.guildId!, COLOR_ROLES);
    await (i.channel as TextChannel).send({ embeds: [embed], components: [row], files: [file] });
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', 'color role menu sent')], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message) {
    const { embed, row, file } = colorRolesMenu(msg.guildId!, COLOR_ROLES);
    await (msg.channel as TextChannel).send({ embeds: [embed], components: [row], files: [file] });
    await msg.delete().catch(() => {});
  },
};

export default cmd;
