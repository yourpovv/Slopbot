import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as autoresponders from '../../data/autoresponders';
import { COLORS } from '../../config';

const cmd: Command = {
  name: 'autoresponder',
  aliases: ['ar', 'autoresponse'],
  description: 'manage auto-responses',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ManageGuild],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('manage auto-responses')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('create a new auto-response')
        .addStringOption(o =>
          o.setName('trigger').setDescription('text that triggers the response').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('response').setDescription('message to send').setRequired(true)
        )
        .addBooleanOption(o =>
          o.setName('match-full').setDescription('only trigger on exact message match')
        )
        .addBooleanOption(o =>
          o.setName('reply').setDescription('reply to the user\'s message')
        )
        .addBooleanOption(o =>
          o.setName('delete-trigger').setDescription('delete the message that triggered it')
        )
        .addIntegerOption(o =>
          o.setName('wait').setDescription('seconds to wait before triggering again (1-300)').setMinValue(1).setMaxValue(300)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('show all auto-responses')
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('delete an auto-response')
        .addIntegerOption(o =>
          o.setName('id').setDescription('autoresponder id').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription('modify an auto-response')
        .addIntegerOption(o =>
          o.setName('id').setDescription('autoresponder id').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('field').setDescription('what to change').setRequired(true).addChoices(
            { name: 'trigger', value: 'trigger' },
            { name: 'response', value: 'response' }
          )
        )
        .addStringOption(o =>
          o.setName('value').setDescription('new value').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('toggle')
        .setDescription('enable/disable an auto-response')
        .addIntegerOption(o =>
          o.setName('id').setDescription('autoresponder id').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('delete all auto-responses')
    ),

  async run(i: ChatInputCommandInteraction) {
    const sub = i.options.getSubcommand();

    switch (sub) {
      case 'add': {
        const trigger = i.options.getString('trigger', true);
        const response = i.options.getString('response', true);
        const matchFull = i.options.getBoolean('match-full') ?? false;
        const reply = i.options.getBoolean('reply') ?? false;
        const deleteTrigger = i.options.getBoolean('delete-trigger') ?? false;
        const wait = i.options.getInteger('wait') ?? 5;
        
        const all = autoresponders.getAllResponders(i.guildId!);
        if (all.length >= 50) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'maximum 50 auto-responses per server')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const id = autoresponders.addResponder(i.guildId!, trigger, response, i.user.id, {
          matchFull,
          replyMode: reply,
          deleteTrigger,
          waitSeconds: wait,
        });
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `auto-response created (id: **${id}**)`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'list': {
        const all = autoresponders.getAllResponders(i.guildId!);
        
        if (all.length === 0) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'info', 'no auto-responses configured')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const embed = new EmbedBuilder()
          .setColor(COLORS.brand)
          .setTitle('Auto-Responses')
          .setDescription(
            all.map(ar => {
              const status = ar.enabled ? '✅' : '❌';
              const mode = ar.matchFull ? 'exact' : 'contains';
              return `**${ar.id}** ${status} \`${ar.trigger}\` → \`${ar.response.slice(0, 30)}${ar.response.length > 30 ? '...' : ''}\` (${mode})`;
            }).join('\n')
          );
        
        await i.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        break;
      }

      case 'remove': {
        const id = i.options.getInteger('id', true);
        const success = autoresponders.removeResponder(id, i.guildId!);
        
        if (!success) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'auto-response not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `removed auto-response **${id}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'edit': {
        const id = i.options.getInteger('id', true);
        const field = i.options.getString('field', true) as 'trigger' | 'response';
        const value = i.options.getString('value', true);
        
        const success = autoresponders.editResponder(id, i.guildId!, field, value);
        
        if (!success) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'auto-response not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `updated ${field} for auto-response **${id}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'toggle': {
        const id = i.options.getInteger('id', true);
        const success = autoresponders.toggleResponder(id, i.guildId!);
        
        if (!success) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'auto-response not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `toggled auto-response **${id}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'reset': {
        autoresponders.resetResponders(i.guildId!);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', 'all auto-responses deleted')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
    }
  },

  async prefix() {
  },
};

export default cmd;
