import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Role,
  ChannelType,
  CategoryChannel,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as guildConfig from '../../data/guildconfig';
import * as voice from '../../data/voice';
import { COLORS } from '../../config';
import { getBrand } from '../../data/brand';

function isOwner(i: ChatInputCommandInteraction): boolean {
  if (i.guild?.ownerId === i.user.id) return true;
  const config = guildConfig.getGuildConfig(i.guildId!);
  if (config.ownerRole) {
    return (i.member as any).roles.cache.has(config.ownerRole);
  }
  return false;
}

const cmd: Command = {
  name: 'setup',
  aliases: [],
  description: 'configure server settings (owner only)',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('configure server settings (owner only)')
    .addSubcommand(sub =>
      sub.setName('view').setDescription('view current configuration')
    )
    .addSubcommand(sub =>
      sub
        .setName('roles')
        .setDescription('set staff roles')
        .addRoleOption(o => o.setName('owner').setDescription('owner role'))
        .addRoleOption(o => o.setName('admin').setDescription('admin role'))
        .addRoleOption(o => o.setName('mod').setDescription('moderator role'))
        .addRoleOption(o => o.setName('staff').setDescription('staff role'))
    )
    .addSubcommand(sub =>
      sub
        .setName('prefix')
        .setDescription('set command prefix')
        .addStringOption(o => o.setName('prefix').setDescription('new prefix').setRequired(true).setMaxLength(5))
    )
    .addSubcommand(sub =>
      sub
        .setName('tickets')
        .setDescription('configure ticket system')
        .addChannelOption(o =>
          o.setName('category').setDescription('category for channel tickets, or text/forum for thread tickets').addChannelTypes(ChannelType.GuildCategory, ChannelType.GuildText, ChannelType.GuildForum)
        )
        .addStringOption(o =>
          o.setName('mode').setDescription('ticket type').addChoices(
            { name: 'channel', value: 'channel' },
            { name: 'thread', value: 'thread' }
          )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('color-add')
        .setDescription('add color role')
        .addStringOption(o => o.setName('name').setDescription('role name (e.g., red, blue)').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('the role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('color-remove')
        .setDescription('remove color role')
        .addStringOption(o => o.setName('name').setDescription('role name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('gender-add')
        .setDescription('add gender/pronoun role')
        .addRoleOption(o => o.setName('role').setDescription('the role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('gender-remove')
        .setDescription('remove gender/pronoun role')
        .addRoleOption(o => o.setName('role').setDescription('the role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('age-add')
        .setDescription('add age role')
        .addRoleOption(o => o.setName('role').setDescription('the role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('age-remove')
        .setDescription('remove age role')
        .addRoleOption(o => o.setName('role').setDescription('the role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('extra-add')
        .setDescription('add extra/alert role')
        .addStringOption(o => o.setName('name').setDescription('role name (e.g., pings, chatRevive)').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('the role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('extra-remove')
        .setDescription('remove extra/alert role')
        .addStringOption(o => o.setName('name').setDescription('role name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('voice-join')
        .setDescription('set up join-to-create voice channels')
        .addChannelOption(o => 
          o.setName('channel').setDescription('voice channel to join').setRequired(true).addChannelTypes(ChannelType.GuildVoice)
        )
        .addChannelOption(o =>
          o.setName('category').setDescription('category for new channels').addChannelTypes(ChannelType.GuildCategory)
        )
        .addStringOption(o =>
          o.setName('name').setDescription('channel name template (use {user} for username)').setMaxLength(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('voice-disable').setDescription('disable join-to-create system')
    ),

  async run(i: ChatInputCommandInteraction) {
    if (!isOwner(i)) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'only server owners can configure settings')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = i.options.getSubcommand();

    switch (sub) {
      case 'view': {
        const config = guildConfig.getGuildConfig(i.guildId!);
        const colorRoles = guildConfig.getColorRoles(i.guildId!);
        const genderRoles = guildConfig.getIdentityRolesByCategory(i.guildId!, 'gender');
        const ageRoles = guildConfig.getIdentityRolesByCategory(i.guildId!, 'age');
        const extraRoles = guildConfig.getExtraRoles(i.guildId!);

        const embed = new EmbedBuilder()
          .setColor(COLORS.brand)
          .setTitle('⚙️ server configuration')
          .addFields(
            {
              name: '🔧 general',
              value:
                `**prefix:** \`${config.prefix}\`\n` +
                `**owner role:** ${config.ownerRole ? `<@&${config.ownerRole}>` : '*not set*'}\n` +
                `**admin role:** ${config.adminRole ? `<@&${config.adminRole}>` : '*not set*'}\n` +
                `**mod role:** ${config.modRole ? `<@&${config.modRole}>` : '*not set*'}\n` +
                `**staff role:** ${config.staffRole ? `<@&${config.staffRole}>` : '*not set*'}`,
              inline: false,
            },
            {
              name: '🎫 tickets',
              value:
                `**category:** ${config.ticketCategory ? `<#${config.ticketCategory}>` : '*not set*'}\n` +
                `**mode:** \`${config.ticketMode}\``,
              inline: false,
            },
            {
              name: '🎨 color roles',
              value: Object.keys(colorRoles).length > 0 ? Object.entries(colorRoles).map(([name, id]) => `${name}: <@&${id}>`).join('\n') : '*none configured*',
              inline: false,
            },
            {
              name: '👤 gender roles',
              value: Object.keys(genderRoles).length > 0 ? Object.values(genderRoles).map(id => `<@&${id}>`).join(', ') : '*none configured*',
              inline: false,
            },
            {
              name: '🎂 age roles',
              value: Object.keys(ageRoles).length > 0 ? Object.values(ageRoles).map(id => `<@&${id}>`).join(', ') : '*none configured*',
              inline: false,
            },
            {
              name: '🔔 extra roles',
              value: Object.keys(extraRoles).length > 0 ? Object.entries(extraRoles).map(([name, id]) => `${name}: <@&${id}>`).join('\n') : '*none configured*',
              inline: false,
            }
          )
          .setFooter({ text: getBrand(i.guildId!) })
          .setTimestamp();

        await i.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        break;
      }

      case 'roles': {
        const owner = i.options.getRole('owner') as Role | null;
        const admin = i.options.getRole('admin') as Role | null;
        const mod = i.options.getRole('mod') as Role | null;
        const staff = i.options.getRole('staff') as Role | null;

        if (!owner && !admin && !mod && !staff) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'provide at least one role to configure')],
            flags: MessageFlags.Ephemeral,
          });
        }

        const changes: string[] = [];
        
        if (owner !== null) {
          guildConfig.setOwnerRole(i.guildId!, owner.id);
          changes.push(`**owner:** ${owner}`);
        }
        if (admin !== null) {
          guildConfig.setAdminRole(i.guildId!, admin.id);
          changes.push(`**admin:** ${admin}`);
        }
        if (mod !== null) {
          guildConfig.setModRole(i.guildId!, mod.id);
          changes.push(`**mod:** ${mod}`);
        }
        if (staff !== null) {
          guildConfig.setStaffRole(i.guildId!, staff.id);
          changes.push(`**staff:** ${staff}`);
        }

        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `staff roles configured:\n${changes.join('\n')}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'prefix': {
        const prefix = i.options.getString('prefix', true);
        guildConfig.setPrefix(i.guildId!, prefix);

        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `prefix set to \`${prefix}\``)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'tickets': {
        const category = i.options.getChannel('category');
        const mode = i.options.getString('mode') as 'channel' | 'thread' | null;

        if (!category && !mode) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'provide category or mode to configure')],
            flags: MessageFlags.Ephemeral,
          });
        }

        const changes: string[] = [];

        if (category !== null) {
          const currentMode = mode ?? guildConfig.getGuildConfig(i.guildId!).ticketMode;
          
          if (currentMode === 'thread' && category.type !== ChannelType.GuildText && category.type !== ChannelType.GuildForum) {
            return void await i.reply({
              embeds: [brandEmbed(i.guildId!, 'error', 'thread tickets require a text channel or forum channel')],
              flags: MessageFlags.Ephemeral,
            });
          }
          
          if (currentMode === 'channel' && category.type !== ChannelType.GuildCategory) {
            return void await i.reply({
              embeds: [brandEmbed(i.guildId!, 'error', 'channel tickets require a category channel')],
              flags: MessageFlags.Ephemeral,
            });
          }
          
          guildConfig.setTicketCategory(i.guildId!, category.id);
          changes.push(`**category:** ${category}`);
        }
        if (mode !== null) {
          guildConfig.setTicketMode(i.guildId!, mode);
          changes.push(`**mode:** ${mode}`);
        }

        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `ticket settings configured:\n${changes.join('\n')}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'color-add': {
        const name = i.options.getString('name', true).toLowerCase();
        const role = i.options.getRole('role', true) as Role;
        guildConfig.setColorRole(i.guildId!, name, role.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `color role **${name}** set to ${role}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'color-remove': {
        const name = i.options.getString('name', true).toLowerCase();
        guildConfig.deleteColorRole(i.guildId!, name);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `color role **${name}** removed`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'gender-add': {
        const role = i.options.getRole('role', true) as Role;
        const existingRoles = guildConfig.getIdentityRolesByCategory(i.guildId!, 'gender');
        const name = `gender_${Object.keys(existingRoles).length + 1}`;
        guildConfig.setIdentityRole(i.guildId!, name, role.id, 'gender');
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `gender role ${role} added`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'gender-remove': {
        const role = i.options.getRole('role', true) as Role;
        guildConfig.deleteIdentityRoleByRoleId(i.guildId!, role.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `gender role ${role} removed`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'age-add': {
        const role = i.options.getRole('role', true) as Role;
        const existingRoles = guildConfig.getIdentityRolesByCategory(i.guildId!, 'age');
        const name = `age_${Object.keys(existingRoles).length + 1}`;
        guildConfig.setIdentityRole(i.guildId!, name, role.id, 'age');
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `age role ${role} added`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'age-remove': {
        const role = i.options.getRole('role', true) as Role;
        guildConfig.deleteIdentityRoleByRoleId(i.guildId!, role.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `age role ${role} removed`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'extra-add': {
        const name = i.options.getString('name', true).toLowerCase();
        const role = i.options.getRole('role', true) as Role;
        guildConfig.setExtraRole(i.guildId!, name, role.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `extra role **${name}** set to ${role}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'extra-remove': {
        const name = i.options.getString('name', true).toLowerCase();
        guildConfig.deleteExtraRole(i.guildId!, name);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `extra role **${name}** removed`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'voice-join': {
        const channel = i.options.getChannel('channel', true);
        const category = i.options.getChannel('category') as CategoryChannel | null;
        const name = i.options.getString('name') ?? '╰ {user}';
        
        voice.setJoinToCreateConfig(i.guildId!, channel.id, category?.id ?? null, name);
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `join-to-create set up in ${channel}\ntemplate: **${name}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'voice-disable': {
        voice.removeJoinToCreateConfig(i.guildId!);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', 'join-to-create disabled')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
      
      default: {
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'error', 'unknown subcommand')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }
    }
  },

  async prefix() {},
};

export default cmd;
