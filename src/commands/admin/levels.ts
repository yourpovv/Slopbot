import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, ChannelType, TextChannel, Role } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as leveling from '../../data/leveling';

const cmd: Command = {
  name: 'levels',
  aliases: [],
  description: 'configure leveling system',
  cooldown: 0,
  permissions: [PermissionFlagsBits.ManageGuild],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('configure leveling system')
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('enable leveling system')
        .addBooleanOption(o =>
          o.setName('enabled').setDescription('enable or disable').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('channel')
        .setDescription('set level-up announcement channel')
        .addChannelOption(o =>
          o.setName('channel').setDescription('announcement channel').addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('dm')
        .setDescription('dm users on level-up')
        .addBooleanOption(o =>
          o.setName('enabled').setDescription('yes or no').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reward')
        .setDescription('add role reward at level')
        .addIntegerOption(o =>
          o.setName('level').setDescription('level (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
        )
        .addRoleOption(o =>
          o.setName('role').setDescription('role to grant').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove-reward')
        .setDescription('remove role reward')
        .addIntegerOption(o =>
          o.setName('level').setDescription('level').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('multiplier')
        .setDescription('xp multiplier')
        .addNumberOption(o =>
          o.setName('value').setDescription('multiplier (0.1-5.0)').setRequired(true).setMinValue(0.1).setMaxValue(5.0)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('reset user xp')
        .addUserOption(o =>
          o.setName('user').setDescription('user to reset').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('give')
        .setDescription('give xp to user')
        .addUserOption(o =>
          o.setName('user').setDescription('user').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('amount').setDescription('xp amount').setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('turn off leveling')
    ),

  async run(i: ChatInputCommandInteraction) {
    const sub = i.options.getSubcommand();

    switch (sub) {
      case 'setup': {
        const enabled = i.options.getBoolean('enabled', true);
        leveling.enableLeveling(i.guildId!, enabled);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `leveling ${enabled ? 'enabled' : 'disabled'}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'channel': {
        const channel = i.options.getChannel('channel') as TextChannel | null;
        leveling.setAnnounceChannel(i.guildId!, channel?.id ?? null);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', channel ? `level-ups will be announced in ${channel}` : 'level-up channel cleared')],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'dm': {
        const enabled = i.options.getBoolean('enabled', true);
        leveling.setDmEnabled(i.guildId!, enabled);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `dm notifications ${enabled ? 'enabled' : 'disabled'}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'reward': {
        const level = i.options.getInteger('level', true);
        const role = i.options.getRole('role', true) as Role;
        leveling.addLevelReward(i.guildId!, level, role.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `level **${level}** now grants ${role}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'remove-reward': {
        const level = i.options.getInteger('level', true);
        leveling.removeLevelReward(i.guildId!, level);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `removed reward for level **${level}**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'multiplier': {
        const value = i.options.getNumber('value', true);
        leveling.setXpMultiplier(i.guildId!, value);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `xp multiplier set to **${value}x**`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'reset': {
        const user = i.options.getUser('user', true);
        leveling.resetUserXp(i.guildId!, user.id);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `reset ${user.tag}'s xp`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'give': {
        const user = i.options.getUser('user', true);
        const amount = i.options.getInteger('amount', true);
        const result = leveling.addXp(i.guildId!, user.id, amount);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', `gave **${amount}** xp to ${user.tag}${result.leveled ? ` (now level ${result.newLevel})` : ''}`)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'disable': {
        leveling.enableLeveling(i.guildId!, false);
        await i.reply({
          embeds: [brandEmbed(i.guildId!, 'success', 'leveling disabled')],
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
