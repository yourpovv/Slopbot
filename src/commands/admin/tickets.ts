import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  Message, 
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';

const cmd: Command = {
  name: 'tickets',
  aliases: ['ticketpanel', 'suggestionpanel'],
  description: 'post a customizable ticket panel',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('post a ticket panel'),

  async run(i: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('ticket_panel_modal')
      .setTitle('Create Ticket Panel');

    const titleInput = new TextInputBuilder()
      .setCustomId('panel_title')
      .setLabel('Panel Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('💡 Suggestions ! !')
      .setRequired(true)
      .setMaxLength(100);

    const bodyInput = new TextInputBuilder()
      .setCustomId('panel_body')
      .setLabel('Panel Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('If you\'d like a new channel/role/anything please\nfill out a ticket so our staff can review it')
      .setRequired(true)
      .setMaxLength(1000);

    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const bodyRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bodyInput);

    modal.addComponents(titleRow, bodyRow);

    await i.showModal(modal);
  },

  async prefix(msg: Message) {
    await msg.reply({ embeds: [brandEmbed(msg.guildId!, 'error', 'use `/tickets` command to customize the panel')] });
  },
};


export default cmd;
