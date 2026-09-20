import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, categorizedRolesMenu } from '../../services/embeds';

const cmd: Command = {
  name: 'roles',
  aliases: ['colorroles', 'colors'],
  description: 'send the role picker embed',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('send the role picker embed'),

  async run(i: ChatInputCommandInteraction) {
    const { embed, rows, file } = categorizedRolesMenu(i.guildId!);
    await (i.channel as TextChannel).send({ embeds: [embed], components: rows, files: [file] });
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', 'role panel sent')], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message) {
    const { embed, rows, file } = categorizedRolesMenu(msg.guildId!);
    await (msg.channel as TextChannel).send({ embeds: [embed], components: rows, files: [file] });
  },
};

export default cmd;
