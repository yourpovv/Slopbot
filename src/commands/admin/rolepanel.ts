import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, ChannelType, TextChannel, Role, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as rolepanels from '../../data/rolepanels';
import { COLORS } from '../../config';

const cmd: Command = {
  name: 'rolepanel',
  aliases: [],
  description: 'manage role panels',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ManageRoles],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('rolepanel')
    .setDescription('manage role panels')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('create new role panel')
        .addStringOption(o =>
          o.setName('name').setDescription('panel name').setRequired(true).setMaxLength(100)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('add role button')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role').setDescription('role to assign').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('label').setDescription('button label').setMaxLength(80)
        )
        .addStringOption(o =>
          o.setName('emoji').setDescription('button emoji')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('remove role button')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role').setDescription('role to remove').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('limit')
        .setDescription('limit selections')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('max').setDescription('max selections (0 = unlimited)').setRequired(true).setMinValue(0).setMaxValue(25)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('required')
        .setDescription('require role to see panel')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role').setDescription('required role')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('post')
        .setDescription('post panel to channel')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
        .addChannelOption(o =>
          o.setName('channel').setDescription('channel to post in').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription('set panel description')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('description').setDescription('panel description').setRequired(true).setMaxLength(500)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('delete role panel')
        .addIntegerOption(o =>
          o.setName('panel').setDescription('panel id').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('show all role panels')
    ),

  async run(i: ChatInputCommandInteraction) {
    const sub = i.options.getSubcommand();

    switch (sub) {
      case 'create': {
        const name = i.options.getString('name', true);
        const id = rolepanels.createPanel(i.guildId!, name);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `created role panel **${name}** (id: **${id}*`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'add': {
        const panelId = i.options.getInteger('panel', true);
        const role = i.options.getRole('role', true) as Role;
        const label = i.options.getString('label') ?? role.name;
        const emoji = i.options.getString('emoji') ?? undefined;
        
        const panel = rolepanels.getPanel(panelId, i.guildId!);
        if (!panel) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const roles = rolepanels.getPanelRoles(panelId);
        if (roles.length >= 25) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'maximum 25 roles per panel')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        rolepanels.addPanelRole(panelId, role.id, label, emoji);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `added ${role} to panel **${panel.name}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'remove': {
        const panelId = i.options.getInteger('panel', true);
        const role = i.options.getRole('role', true) as Role;
        
        const panel = rolepanels.getPanel(panelId, i.guildId!);
        if (!panel) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const success = rolepanels.removePanelRole(panelId, role.id);
        if (!success) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'role not found in panel')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `removed ${role} from panel **${panel.name}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'limit': {
        const panelId = i.options.getInteger('panel', true);
        const max = i.options.getInteger('max', true);
        
        const panel = rolepanels.getPanel(panelId, i.guildId!);
        if (!panel) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        rolepanels.setPanelLimit(panelId, max);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', max === 0 ? 'unlimited selections' : `max selections set to **${max}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'required': {
        const panelId = i.options.getInteger('panel', true);
        const role = i.options.getRole('role') as Role | null;
        
        const panel = rolepanels.getPanel(panelId, i.guildId!);
        if (!panel) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        rolepanels.setPanelRequired(panelId, role?.id ?? null);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', role ? `requires ${role} to see panel` : 'removed required role')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'post': {
        const panelId = i.options.getInteger('panel', true);
        const channel = i.options.getChannel('channel', true) as TextChannel;
        
        const panel = rolepanels.getPanel(panelId, i.guildId!);
        if (!panel) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const roles = rolepanels.getPanelRoles(panelId);
        if (roles.length === 0) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'add roles to the panel first')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const embed = new EmbedBuilder()
          .setColor(COLORS.brand)
          .setTitle(panel.name)
          .setDescription(panel.description ?? 'Select your roles below');
        
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        let currentRow = new ActionRowBuilder<ButtonBuilder>();
        let buttonsInRow = 0;
        
        for (const r of roles) {
          if (buttonsInRow === 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder<ButtonBuilder>();
            buttonsInRow = 0;
          }
          
          const button = new ButtonBuilder()
            .setCustomId(`rolepanel_${panelId}_${r.roleId}`)
            .setLabel(r.label)
            .setStyle(ButtonStyle.Primary);
          
          if (r.emoji) {
            button.setEmoji(r.emoji);
          }
          
          currentRow.addComponents(button);
          buttonsInRow++;
        }
        
        if (buttonsInRow > 0) {
          rows.push(currentRow);
        }
        
        const msg = await channel.send({ embeds: [embed], components: rows });
        rolepanels.setPanelMessage(panelId, msg.id, channel.id);
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `posted panel to ${channel}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'edit': {
        const panelId = i.options.getInteger('panel', true);
        const description = i.options.getString('description', true);
        
        const panel = rolepanels.getPanel(panelId, i.guildId!);
        if (!panel) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        rolepanels.setPanelDescription(panelId, description);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', 'panel description updated')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'delete': {
        const panelId = i.options.getInteger('panel', true);
        const success = rolepanels.deletePanel(panelId, i.guildId!);
        
        if (!success) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'panel not found')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `deleted panel **${panelId}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'list': {
        const panels = rolepanels.getAllPanels(i.guildId!);
        
        if (panels.length === 0) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'info', 'no role panels configured')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        const embed = new EmbedBuilder()
          .setColor(COLORS.brand)
          .setTitle('Role Panels')
          .setDescription(
            panels.map(p => {
              const roles = rolepanels.getPanelRoles(p.id);
              return `**${p.id}** • ${p.name} (${roles.length} roles)`;
            }).join('\n')
          );
        
        await i.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        break;
      }
    }
  },

  async prefix() {
  },
};

export default cmd;
