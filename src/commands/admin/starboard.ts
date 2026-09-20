import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, ChannelType, TextChannel, Role } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as starboard from '../../data/starboard';

const cmd: Command = {
  name: 'starboard',
  aliases: [],
  description: 'configure starboard',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ManageGuild],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('starboard')
    .setDescription('configure starboard')
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('set up the starboard')
        .addChannelOption(o =>
          o.setName('channel').setDescription('starboard channel').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('stars')
        .setDescription('set how many stars needed')
        .addIntegerOption(o =>
          o.setName('count').setDescription('number of stars (1-50)').setRequired(true).setMinValue(1).setMaxValue(50)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('emoji')
        .setDescription('change star emoji')
        .addStringOption(o =>
          o.setName('emoji').setDescription('emoji to use').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('ignore')
        .setDescription('ignore specific channels/roles/users')
        .addChannelOption(o => o.setName('channel').setDescription('channel to ignore'))
        .addRoleOption(o => o.setName('role').setDescription('role to ignore'))
        .addUserOption(o => o.setName('user').setDescription('user to ignore'))
    )
    .addSubcommand(sub =>
      sub
        .setName('allow-self')
        .setDescription('allow users to star their own messages')
        .addBooleanOption(o =>
          o.setName('enabled').setDescription('yes or no').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('disable')
        .setDescription('turn off starboard')
    ),

  async run(i: ChatInputCommandInteraction) {
    const sub = i.options.getSubcommand();

    switch (sub) {
      case 'setup': {
        const channel = i.options.getChannel('channel', true) as TextChannel;
        starboard.setupStarboard(i.guildId!, channel.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `starboard set to ${channel}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'stars': {
        const count = i.options.getInteger('count', true);
        const config = starboard.getStarboardConfig(i.guildId!);
        
        if (!config) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'starboard not set up yet. use `/starboard setup` first')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        starboard.setStarboardStars(i.guildId!, count);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `now requires **${count}** stars`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'emoji': {
        const emoji = i.options.getString('emoji', true);
        const config = starboard.getStarboardConfig(i.guildId!);
        
        if (!config) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'starboard not set up yet. use `/starboard setup` first')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        starboard.setStarboardEmoji(i.guildId!, emoji);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `star emoji changed to ${emoji}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'ignore': {
        const channel = i.options.getChannel('channel');
        const role = i.options.getRole('role') as Role | null;
        const user = i.options.getUser('user');
        
        if (!channel && !role && !user) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'provide at least one: channel, role, or user')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        if (channel) {
          starboard.addStarboardIgnore(i.guildId!, channel.id, 'channel');
        }
        if (role) {
          starboard.addStarboardIgnore(i.guildId!, role.id, 'role');
        }
        if (user) {
          starboard.addStarboardIgnore(i.guildId!, user.id, 'user');
        }
        
        const items = [
          channel ? `${channel}` : null,
          role ? `<@&${role.id}>` : null,
          user ? `${user}` : null,
        ].filter(Boolean).join(', ');
        
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `now ignoring: ${items}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'allow-self': {
        const enabled = i.options.getBoolean('enabled', true);
        const config = starboard.getStarboardConfig(i.guildId!);
        
        if (!config) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId!, 'error', 'starboard not set up yet. use `/starboard setup` first')],
            flags: MessageFlags.Ephemeral,
          });
        }
        
        starboard.setStarboardAllowSelf(i.guildId!, enabled);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `self-starring ${enabled ? 'enabled' : 'disabled'}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'disable': {
        starboard.disableStarboard(i.guildId!);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', 'starboard disabled')],
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
